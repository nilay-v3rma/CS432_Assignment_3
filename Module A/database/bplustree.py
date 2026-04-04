
from graphviz import Digraph
import bisect

# B+ Tree Node class. Can be used as either internal or leaf node.
class BPlusTreeNode:
    def __init__(self, order, is_leaf=True):
        self.order = order                  # Maximum number of children a node can have
        self.is_leaf = is_leaf              # Flag to check if node is a leaf
        self.keys = []                      # List of keys in the node
        self.values = []                    # Used in leaf nodes to store associated values
        self.children = []                  # Used in internal nodes to store child pointers
        self.next = None                    # Points to next leaf node for range queries

    def is_full(self):
        # A node is full if it has reached the maximum number of keys (order - 1)
        return len(self.keys) >= self.order - 1


class BPlusTree:
    def __init__(self, order=8):
        self.order = order                          # Maximum number of children per internal node
        self.root = BPlusTreeNode(order)            # Start with an empty leaf node as root



    def search(self, key):
        """Search for a key in the B+ tree and return the associated value"""
        node = self.root
        while not node.is_leaf:
            i = bisect.bisect_left(node.keys, key)
            node = node.children[i]
        i = bisect.bisect_left(node.keys, key)
        if i < len(node.keys) and node.keys[i] == key:
            return node.values[i]
        return None


    def _search(self, node, key):
        """Helper function to recursively search for a key starting from the given node"""
        if node.is_leaf:
            i = bisect.bisect_left(node.keys, key)
            if i < len(node.keys) and node.keys[i] == key:
                return node.values[i]
            return None
        else:
            i = bisect.bisect_left(node.keys, key)
            return self._search(node.children[i], key)



    def insert(self, key, value):
        """Insert a new key-value pair into the B+ tree"""
        root = self.root
        if root.is_full():
            # Create new root and split
            new_root = BPlusTreeNode(self.order, is_leaf=False)
            new_root.children.append(self.root)
            self._split_child(new_root, 0)
            self.root = new_root
        self._insert_non_full(self.root, key, value)


    def _insert_non_full(self, node, key, value):
        """Insert key-value into a node that is not full"""
        if node.is_leaf:
            i = bisect.bisect_left(node.keys, key)
            node.keys.insert(i, key)
            node.values.insert(i, value)
        else:
            i = bisect.bisect_left(node.keys, key)
            if node.children[i].is_full():
                self._split_child(node, i)
                # After split, decide which child to descend into
                if key >= node.keys[i]:
                    i += 1
            self._insert_non_full(node.children[i], key, value)


    def _split_child(self, parent, index):
        """
        Split the child node at given index in the parent.
        This is triggered when the child is full.
        """
        node = parent.children[index]
        order = self.order
        mid = (order - 1) // 2
        if node.is_leaf:
            # Split leaf node
            new_leaf = BPlusTreeNode(order, is_leaf=True)
            new_leaf.keys = node.keys[mid:]
            new_leaf.values = node.values[mid:]
            node.keys = node.keys[:mid]
            node.values = node.values[:mid]
            # Insert new_leaf into parent's children
            parent.keys.insert(index, new_leaf.keys[0])
            parent.children.insert(index + 1, new_leaf)
            # Link leaf nodes
            new_leaf.next = node.next
            node.next = new_leaf
        else:
            # Split internal node
            new_internal = BPlusTreeNode(order, is_leaf=False)
            # Promote the middle key to parent
            promote_key = node.keys[mid]
            new_internal.keys = node.keys[mid+1:]
            new_internal.children = node.children[mid+1:]
            node.keys = node.keys[:mid]
            node.children = node.children[:mid+1]
            parent.keys.insert(index, promote_key)
            parent.children.insert(index + 1, new_internal)


    def delete(self, key):
        """Delete a key from the B+ tree and return the deleted value for logging"""
        # First, find the value so we can return it
        old_value = self.search(key)
        if old_value is None:
            return None # Key doesn't exist
            
        self._delete(self.root, key)
        # If root is internal and has only one child, make child the new root
        if not self.root.is_leaf and len(self.root.children) == 1:
            self.root = self.root.children[0]
            
        return old_value

    def update(self, key, new_value):
        """Update a key and return the old_value for logging"""
        node = self.root
        while not node.is_leaf:
            i = bisect.bisect_left(node.keys, key)
            node = node.children[i]
        i = bisect.bisect_left(node.keys, key)
        if i < len(node.keys) and node.keys[i] == key:
            old_value = node.values[i]
            node.values[i] = new_value
            return old_value # Return the old value instead of True
        return None # Return None instead of False

    def _delete(self, node, key):
        if node.is_leaf:
            if key in node.keys:
                idx = node.keys.index(key)
                node.keys.pop(idx)
                node.values.pop(idx)
            return
        # Internal node
        i = 0
        while i < len(node.keys) and key >= node.keys[i]:
            i += 1
        child = node.children[i]
        # If child will have too few keys after deletion, fix it
        min_keys = (self.order - 1) // 2
        if len(child.keys) == min_keys:
            if i > 0 and len(node.children[i-1].keys) > min_keys:
                self._borrow_from_prev(node, i)
            elif i < len(node.children) - 1 and len(node.children[i+1].keys) > min_keys:
                self._borrow_from_next(node, i)
            else:
                if i > 0:
                    self._merge(node, i-1)
                    child = node.children[i-1]
                else:
                    self._merge(node, i)
                    child = node.children[i]
        self._delete(child, key)

    def _fill_child(self, node, index):
        # Not needed, handled in _delete
        pass

    def _borrow_from_prev(self, node, index):
        child = node.children[index]
        left_sibling = node.children[index-1]
        if child.is_leaf:
            # Move last key-value from left sibling to front of child
            child.keys.insert(0, left_sibling.keys.pop(-1))
            child.values.insert(0, left_sibling.values.pop(-1))
            node.keys[index-1] = child.keys[0]
        else:
            # Move last key from left sibling up to parent, parent key down to child
            child.keys.insert(0, node.keys[index-1])
            node.keys[index-1] = left_sibling.keys.pop(-1)
            child.children.insert(0, left_sibling.children.pop(-1))

    def _borrow_from_next(self, node, index):
        child = node.children[index]
        right_sibling = node.children[index+1]
        if child.is_leaf:
            # Move first key-value from right sibling to end of child
            child.keys.append(right_sibling.keys.pop(0))
            child.values.append(right_sibling.values.pop(0))
            node.keys[index] = right_sibling.keys[0]
        else:
            # Move first key from right sibling up to parent, parent key down to child
            child.keys.append(node.keys[index])
            node.keys[index] = right_sibling.keys.pop(0)
            child.children.append(right_sibling.children.pop(0))

    def _merge(self, node, index):
        child = node.children[index]
        sibling = node.children[index+1]
        if child.is_leaf:
            child.keys.extend(sibling.keys)
            child.values.extend(sibling.values)
            child.next = sibling.next
            node.keys.pop(index)
            node.children.pop(index+1)
        else:
            # Merge with separator key from parent
            child.keys.append(node.keys.pop(index))
            child.keys.extend(sibling.keys)
            child.children.extend(sibling.children)
            node.children.pop(index+1)


    def range_query(self, start_key, end_key):
        result = []
        node = self.root
        # Go to the leftmost leaf node that may contain start_key
        while not node.is_leaf:
            i = bisect.bisect_left(node.keys, start_key)
            node = node.children[i]
        # Traverse leaf nodes
        while node:
            i = bisect.bisect_left(node.keys, start_key)
            while i < len(node.keys) and node.keys[i] <= end_key:
                if node.keys[i] >= start_key:
                    result.append((node.keys[i], node.values[i]))
                i += 1
            if i < len(node.keys):
                break
            node = node.next
        return result

    def get_all(self):
        result = []
        node = self.root
        # Go to leftmost leaf
        while not node.is_leaf:
            node = node.children[0]
        while node:
            for k, v in zip(node.keys, node.values):
                result.append((k, v))
            node = node.next
        return result

    def _get_all(self, node, result):
        if node.is_leaf:
            for k, v in zip(node.keys, node.values):
                result.append((k, v))
        else:
            for child in node.children:
                self._get_all(child, result)


    def visualize_tree(self, filename=None):
        dot = Digraph(comment="B+ Tree")
        dot.attr(rankdir='TB', splines='polyline', nodesep='0.55', ranksep='0.8')
        dot.attr('node', fontname='Helvetica', fontsize='11', penwidth='1.2')
        dot.attr('edge', color='#6B7280', arrowsize='0.7')

        self._add_nodes(dot, self.root)
        self._add_edges(dot, self.root)

        leaf_ids = self._collect_leaf_ids()
        if leaf_ids:
            with dot.subgraph(name='cluster_leaf_rank') as leaves:
                leaves.attr(rank='same', color='transparent')
                for leaf_id in leaf_ids:
                    leaves.node(leaf_id)

        if filename:
            dot.render(filename, view=False, format='png')
        return dot

    def _collect_leaf_ids(self):
        """Collect leaf nodes from left to right to keep them on one visual rank."""
        leaf_ids = []
        node = self.root
        while not node.is_leaf:
            node = node.children[0]
        while node:
            leaf_ids.append(str(id(node)))
            node = node.next
        return leaf_ids

    def _add_nodes(self, dot, node):
        node_id = str(id(node))
        key_text = ' | '.join(str(k) for k in node.keys) if node.keys else 'empty'

        if node.is_leaf:
            dot.node(
                node_id,
                f"Leaf\\n{key_text}",
                shape='box',
                style='filled,rounded',
                fillcolor='#DBEAFE',
                color='#1D4ED8'
            )
        else:
            dot.node(
                node_id,
                f"Internal\\n{key_text}",
                shape='box',
                style='filled,rounded',
                fillcolor='#E5E7EB',
                color='#374151'
            )

        if not node.is_leaf:
            for child in node.children:
                self._add_nodes(dot, child)

    def _add_edges(self, dot, node):
        if not node.is_leaf:
            for child in node.children:
                dot.edge(str(id(node)), str(id(child)))
                self._add_edges(dot, child)
        # Add leaf node linkage
        if node.is_leaf and node.next:
            dot.edge(
                str(id(node)),
                str(id(node.next)),
                style='dashed',
                color='#2563EB',
                constraint='false'
            )
