import sqlite3
import json
import cmd
import hashlib
import shlex

DATABASE_PATH = 'decision-tree-ui/database/decision_tree.db'

class DatabaseManager(cmd.Cmd):
    intro = 'Welcome to the database manager. Type help or ? to list commands.\n'
    prompt = '(db) '

    def do_insert_paper(self, arg):
        'Insert a new paper: insert_paper title development_outcome study_outcome_type'
        args = arg.split()
        if len(args) != 3:
            print("Usage: insert_paper title development_outcome study_outcome_type")
            return
        title, development_outcome, study_outcome_type = args
        data = {
            "title": title,
            "development outcome": development_outcome,
            "study outcome type": study_outcome_type
        }
        hash_value = hashlib.md5(title.encode()).hexdigest()
        conn = sqlite3.connect(DATABASE_PATH)
        c = conn.cursor()
        c.execute("INSERT INTO papers (hash, data) VALUES (?, ?)", (hash_value, json.dumps(data)))
        conn.commit()
        conn.close()
        print("Paper inserted successfully.")

    def do_delete_paper(self, arg):
        'Delete a paper by title: delete_paper title'
        title = arg.strip()
        if not title:
            print("Usage: delete_paper title")
            return
        hash_value = hashlib.md5(title.encode()).hexdigest()
        conn = sqlite3.connect(DATABASE_PATH)
        c = conn.cursor()
        c.execute("DELETE FROM papers WHERE hash = ?", (hash_value,))
        conn.commit()
        conn.close()
        print("Paper deleted successfully.")

    def do_list_papers(self, arg):
        'List all papers'
        conn = sqlite3.connect(DATABASE_PATH)
        c = conn.cursor()
        c.execute("SELECT data FROM papers")
        rows = c.fetchall()
        for row in rows:
            print(json.loads(row[0]))
        conn.close()

    def do_insert_category(self, arg):
        'Insert a new category mapping: insert_category main_category sub_category'
        args = shlex.split(arg)
        if len(args) != 2:
            print("Usage: insert_category main_category sub_category")
            return
        main_category, sub_category = args
        conn = sqlite3.connect(DATABASE_PATH)
        c = conn.cursor()
        c.execute("INSERT INTO category_mappings (main_category, sub_category) VALUES (?, ?)", (main_category, sub_category))
        conn.commit()
        conn.close()
        print("Category mapping inserted successfully.")

    def do_delete_category(self, arg):
        'Delete a category mapping: delete_category main_category sub_category'
        args = shlex.split(arg)
        if len(args) != 2:
            print("Usage: delete_category main_category sub_category")
            return
        main_category, sub_category = args
        conn = sqlite3.connect(DATABASE_PATH)
        c = conn.cursor()
        c.execute("DELETE FROM category_mappings WHERE main_category = ? AND sub_category = ?", (main_category, sub_category))
        conn.commit()
        conn.close()
        print("Category mapping deleted successfully.")

    def do_list_categories(self, arg):
        'List all category mappings'
        conn = sqlite3.connect(DATABASE_PATH)
        c = conn.cursor()
        c.execute("SELECT main_category, sub_category FROM category_mappings")
        rows = c.fetchall()
        for row in rows:
            print(f"Main Category: {row[0]}, Sub Category: {row[1]}")
        conn.close()

    def do_exit(self, arg):
        'Exit the database manager'
        print("Goodbye!")
        return True

if __name__ == '__main__':
    DatabaseManager().cmdloop()
