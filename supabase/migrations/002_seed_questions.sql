-- ============================================================
-- QUESTION BANK SEED DATA
-- Run this AFTER 001_initial_schema.sql
-- ============================================================

INSERT INTO public.questions (skill_tag, question_text, option_a, option_b, option_c, option_d, correct_option, difficulty, explanation) VALUES

-- ── JAVA ────────────────────────────────────────────────────
('Java', 'Which of the following is NOT a primitive data type in Java?', 'int', 'float', 'String', 'boolean', 'C', 'easy', 'String is a class in Java, not a primitive type. Primitives are int, float, double, boolean, char, byte, short, long.'),
('Java', 'What is the output of: System.out.println(10 / 3)?', '3.33', '3', '4', 'Error', 'B', 'easy', 'Integer division in Java truncates the decimal: 10/3 = 3.'),
('Java', 'Which keyword is used to prevent a class from being subclassed in Java?', 'static', 'abstract', 'final', 'private', 'C', 'easy', 'The final keyword prevents a class from being extended.'),
('Java', 'What does JVM stand for?', 'Java Virtual Memory', 'Java Virtual Machine', 'Java Variable Method', 'Java Verified Module', 'B', 'easy', 'JVM = Java Virtual Machine, which executes Java bytecode.'),
('Java', 'Which collection class allows null keys and null values?', 'TreeMap', 'Hashtable', 'HashMap', 'ConcurrentHashMap', 'C', 'medium', 'HashMap allows one null key and multiple null values. Hashtable does not allow nulls.'),
('Java', 'What is the time complexity of ArrayList.get(index)?', 'O(n)', 'O(log n)', 'O(1)', 'O(n log n)', 'C', 'medium', 'ArrayList uses an array internally, so index-based access is O(1).'),
('Java', 'Which interface must be implemented to use an object in a TreeSet?', 'Serializable', 'Cloneable', 'Comparable', 'Iterable', 'C', 'medium', 'TreeSet requires elements to implement Comparable (or a Comparator) for ordering.'),
('Java', 'What is the purpose of the volatile keyword?', 'Prevents method overriding', 'Ensures thread-safe reads/writes to a variable', 'Creates an immutable variable', 'Marks a variable for garbage collection', 'B', 'hard', 'volatile ensures visibility of changes to variables across threads without synchronization.'),
('Java', 'Which design pattern is used by java.util.Iterator?', 'Factory', 'Observer', 'Iterator', 'Strategy', 'C', 'hard', 'java.util.Iterator implements the Iterator design pattern for sequential access.'),
('Java', 'What happens if a thread calls wait() without holding the object lock?', 'It pauses for 1 second', 'IllegalMonitorStateException is thrown', 'It works normally', 'The method is ignored', 'B', 'hard', 'wait() must be called from a synchronized block/method, otherwise IllegalMonitorStateException is thrown.'),

-- ── PYTHON ──────────────────────────────────────────────────
('Python', 'Which of the following is a mutable data type in Python?', 'tuple', 'string', 'list', 'int', 'C', 'easy', 'Lists are mutable; tuples, strings, and ints are immutable.'),
('Python', 'What is the output of: print(type([]))?', '<class list>', '<class dict>', '<class tuple>', '<class array>', 'A', 'easy', 'An empty [] is a list, so type([]) returns <class list>.'),
('Python', 'Which keyword is used to define a generator function?', 'return', 'yield', 'async', 'generate', 'B', 'easy', 'yield makes a function a generator. When called, it returns a generator object.'),
('Python', 'What does the enumerate() function do?', 'Converts a list to a set', 'Returns index-value pairs', 'Sorts a list', 'Filters elements', 'B', 'easy', 'enumerate() returns an enumerate object of (index, value) pairs.'),
('Python', 'What is the time complexity of dictionary lookup in Python?', 'O(n)', 'O(log n)', 'O(1) average', 'O(n²)', 'C', 'medium', 'Python dict uses a hash table, giving O(1) average lookup.'),
('Python', 'Which method is used to remove and return the last element from a list?', 'remove()', 'delete()', 'pop()', 'discard()', 'C', 'easy', 'list.pop() removes and returns the last element by default.'),
('Python', 'What is a decorator in Python?', 'A class that inherits from another', 'A function that modifies another function', 'A module for GUI design', 'A type of list comprehension', 'B', 'medium', 'Decorators wrap a function to extend its behavior without modifying it directly.'),
('Python', 'What does *args allow in a function definition?', 'Keyword arguments only', 'A variable number of positional arguments', 'Arguments with default values', 'Private arguments', 'B', 'medium', '*args allows a function to accept any number of positional arguments as a tuple.'),
('Python', 'What is the output of: [x**2 for x in range(3)]?', '[0, 1, 4]', '[1, 4, 9]', '[0, 1, 2]', '[0, 2, 4]', 'A', 'medium', 'range(3) = 0,1,2. Squaring: 0²=0, 1²=1, 2²=4 → [0,1,4].'),
('Python', 'Which of the following is true about Python GIL?', 'Allows true multi-threading', 'Prevents multiple threads from executing Python bytecode simultaneously', 'Only applies to I/O operations', 'Was removed in Python 3', 'B', 'hard', 'The GIL is a mutex that protects access to Python objects, preventing true parallelism in CPU-bound threads.'),

-- ── SQL ─────────────────────────────────────────────────────
('SQL', 'Which SQL statement is used to retrieve data from a database?', 'INSERT', 'SELECT', 'UPDATE', 'DELETE', 'B', 'easy', 'SELECT is used to query/retrieve data from a database table.'),
('SQL', 'What does the WHERE clause do in SQL?', 'Sorts results', 'Groups results', 'Filters records', 'Joins tables', 'C', 'easy', 'WHERE filters rows based on a specified condition.'),
('SQL', 'Which SQL keyword removes duplicate rows from results?', 'UNIQUE', 'DISTINCT', 'GROUP BY', 'HAVING', 'B', 'easy', 'SELECT DISTINCT removes duplicate rows from the result set.'),
('SQL', 'What is a PRIMARY KEY?', 'A key that references another table', 'A unique identifier for each row in a table', 'A key that can be NULL', 'An index on multiple columns', 'B', 'easy', 'A PRIMARY KEY uniquely identifies each row and cannot be NULL.'),
('SQL', 'What is the difference between INNER JOIN and LEFT JOIN?', 'No difference', 'INNER JOIN returns only matching rows; LEFT JOIN returns all left rows plus matches', 'LEFT JOIN returns only unmatched rows', 'INNER JOIN includes NULL values', 'B', 'medium', 'INNER JOIN returns only rows with matching values in both tables. LEFT JOIN returns all rows from the left table plus matched rows.'),
('SQL', 'Which aggregate function counts non-NULL values?', 'SUM()', 'AVG()', 'COUNT(column)', 'MAX()', 'C', 'medium', 'COUNT(column_name) counts non-NULL values in that column.'),
('SQL', 'What does GROUP BY do?', 'Sorts results alphabetically', 'Filters results after aggregation', 'Groups rows with the same value for aggregation', 'Joins two tables', 'C', 'medium', 'GROUP BY groups rows that have the same values, typically used with aggregate functions.'),
('SQL', 'What is the purpose of an INDEX in SQL?', 'Enforces referential integrity', 'Speeds up data retrieval', 'Creates relationships between tables', 'Prevents duplicate entries', 'B', 'medium', 'An index creates a data structure that speeds up SELECT queries at the cost of slower writes.'),
('SQL', 'What is a FOREIGN KEY?', 'A key that uniquely identifies each row', 'A key that references the PRIMARY KEY of another table', 'A key that allows NULL values only', 'A composite key', 'B', 'medium', 'A FOREIGN KEY enforces referential integrity between two tables.'),
('SQL', 'What is the difference between DELETE and TRUNCATE?', 'No difference', 'DELETE removes all rows; TRUNCATE removes specific rows', 'DELETE can be rolled back; TRUNCATE cannot in most databases', 'TRUNCATE uses WHERE clause', 'C', 'hard', 'DELETE is DML and can be rolled back. TRUNCATE is DDL; in most databases it cannot be rolled back easily.'),

-- ── REACT ───────────────────────────────────────────────────
('React', 'What is JSX?', 'A JavaScript library', 'A syntax extension that allows HTML in JavaScript', 'A CSS preprocessor', 'A database query language', 'B', 'easy', 'JSX is a syntax extension for JavaScript that looks like HTML and is used to describe React UI.'),
('React', 'Which hook is used to manage state in a functional component?', 'useEffect', 'useRef', 'useState', 'useContext', 'C', 'easy', 'useState is the primary hook for adding state to functional components.'),
('React', 'What does the useEffect hook do?', 'Manages component state', 'Performs side effects (data fetching, subscriptions)', 'Creates a new component', 'Handles form submissions', 'B', 'easy', 'useEffect runs side effects after rendering, like data fetching, subscriptions, or DOM manipulation.'),
('React', 'What is the virtual DOM in React?', 'A copy of the real DOM stored in browser memory', 'A lightweight JavaScript representation of the real DOM', 'A server-side rendering technique', 'A database for storing UI state', 'B', 'easy', 'React maintains a virtual DOM (a JS object) and uses diffing to update only changed parts of the real DOM.'),
('React', 'What is prop drilling?', 'Optimizing component re-renders', 'Passing props through multiple component layers unnecessarily', 'A React performance hook', 'A way to access global state', 'B', 'medium', 'Prop drilling occurs when you pass props through many intermediate components that don''t need them.'),
('React', 'What does React.memo do?', 'Memoizes a hook return value', 'Prevents a component from re-rendering if props haven''t changed', 'Creates a memo for state', 'Provides a context value', 'B', 'medium', 'React.memo is a HOC that memoizes a component, preventing re-renders when props are unchanged.'),
('React', 'What is the purpose of useCallback?', 'Memoizes a value', 'Memoizes a function reference', 'Creates a ref', 'Handles async operations', 'B', 'medium', 'useCallback returns a memoized callback function, preventing unnecessary re-creations on re-renders.'),
('React', 'What is the key prop used for in list rendering?', 'Styling list items', 'Helping React identify which items changed, added, or removed', 'Setting the index of an element', 'Creating unique IDs', 'B', 'easy', 'Keys help React efficiently update lists by identifying which elements changed.'),
('React', 'What does useContext do?', 'Creates a new context', 'Subscribes to a React context and returns its value', 'Provides state management', 'Handles side effects', 'B', 'medium', 'useContext consumes the nearest matching context Provider and returns its current value.'),
('React', 'What is the difference between controlled and uncontrolled components?', 'No difference', 'Controlled: form data handled by React state; Uncontrolled: handled by the DOM', 'Uncontrolled components use hooks', 'Controlled components use refs', 'B', 'medium', 'Controlled components have their values controlled by React state via onChange handlers. Uncontrolled components store their state in the DOM.'),

-- ── DATA STRUCTURES ─────────────────────────────────────────
('Data Structures', 'What is the time complexity of searching in a binary search tree (BST) in the average case?', 'O(1)', 'O(log n)', 'O(n)', 'O(n²)', 'B', 'medium', 'BST average case search is O(log n) for a balanced tree. Worst case (skewed) is O(n).'),
('Data Structures', 'Which data structure operates on LIFO (Last In, First Out) principle?', 'Queue', 'Stack', 'Linked List', 'Array', 'B', 'easy', 'A Stack follows LIFO — the last element pushed is the first to be popped.'),
('Data Structures', 'What is the time complexity of inserting at the beginning of a singly linked list?', 'O(n)', 'O(log n)', 'O(1)', 'O(n²)', 'C', 'easy', 'Inserting at the head of a linked list only requires updating the head pointer — O(1).'),
('Data Structures', 'In a max-heap, the root element is:', 'The smallest element', 'The middle element', 'The largest element', 'A random element', 'C', 'easy', 'In a max-heap, the root is always the maximum element.'),
('Data Structures', 'Which algorithm uses a queue for graph traversal?', 'DFS', 'BFS', 'Dijkstra only', 'Binary Search', 'B', 'easy', 'Breadth-First Search (BFS) uses a queue to explore nodes level by level.'),

-- ── JAVASCRIPT ──────────────────────────────────────────────
('JavaScript', 'What is the output of: typeof null?', '"null"', '"undefined"', '"object"', '"NaN"', 'C', 'easy', 'typeof null returns "object" — this is a well-known JavaScript bug that has been kept for backward compatibility.'),
('JavaScript', 'What does === check?', 'Value only', 'Type only', 'Both value and type', 'Reference equality', 'C', 'easy', '=== is the strict equality operator that checks both value and type without coercion.'),
('JavaScript', 'What is a closure in JavaScript?', 'A function that returns a promise', 'A function that has access to its outer scope even after the outer function has returned', 'A way to close a browser window', 'A module pattern', 'B', 'medium', 'A closure is a function that retains access to its lexical scope even when executed outside that scope.'),
('JavaScript', 'What is the event loop in JavaScript?', 'A loop that handles DOM events', 'A mechanism that allows JavaScript to perform non-blocking operations', 'A CSS animation loop', 'A server-side concept', 'B', 'medium', 'The event loop allows JavaScript to be non-blocking by offloading operations and executing callbacks from the queue.'),
('JavaScript', 'What is the difference between let and var?', 'No difference', 'let has block scope; var has function scope', 'var cannot be reassigned', 'let is deprecated', 'B', 'medium', 'var is function-scoped and is hoisted. let is block-scoped and is not hoisted in the same way.');

-- ── SEED CODING QUESTIONS ───────────────────────────────────
INSERT INTO public.coding_questions (skill_tag, title, problem_text, sample_input, sample_output, test_cases, difficulty) VALUES
('Python', 'Sum of Array', 'Given an array of integers, return their sum.', '5\n1 2 3 4 5', '15', '[{"input": "3\n1 2 3", "expected_output": "6"}, {"input": "5\n1 2 3 4 5", "expected_output": "15"}]', 'easy'),
('Java', 'Fibonacci Number', 'Given n, return the nth Fibonacci number. F(0)=0, F(1)=1, F(n)=F(n-1)+F(n-2).', '6', '8', '[{"input": "0", "expected_output": "0"}, {"input": "6", "expected_output": "8"}, {"input": "10", "expected_output": "55"}]', 'easy'),
('SQL', 'Count Employees by Department', 'Write a SQL query to count the number of employees in each department from the employees table. Columns: id, name, department.', '', 'HR 5\nEngineering 12\nSales 8', '[{"input": "SELECT department, COUNT(*) FROM employees GROUP BY department", "expected_output": "valid"}]', 'medium'),
('JavaScript', 'Palindrome Check', 'Write a function to check if a string is a palindrome (reads the same forward and backward). Return true or false.', 'racecar', 'true', '[{"input": "racecar", "expected_output": "true"}, {"input": "hello", "expected_output": "false"}]', 'easy'),
('Python', 'Two Sum', 'Given an array of integers nums and an integer target, return indices of the two numbers that add up to target.', '[2,7,11,15]\n9', '[0, 1]', '[{"input": "[2,7,11,15]\n9", "expected_output": "[0, 1]"}, {"input": "[3,2,4]\n6", "expected_output": "[1, 2]"}]', 'medium');
