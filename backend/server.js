// © 2024 Learning for Well-Being Institute. All rights reserved.
// Policy Decision Tree
// policydecisions.org

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');
const app = express();

app.use(cors());
app.use(express.json()); // Add this line to parse JSON request bodies

const dbPath = path.join(__dirname, '..', 'database', 'decision_tree.db');

function capitalizeWords(str) {
  return str.replace(/\b\w/g, l => l.toUpperCase());
}

app.get('/api/categories', (req, res) => {
  const db = new sqlite3.Database(dbPath);
  const categories = {};

  db.all("SELECT data FROM papers", [], (err, rows) => {
    if (err) {
      console.error('Error fetching categories:', err);
      res.status(500).json({ error: err.message });
      return;
    }

    rows.forEach(row => {
      const data = JSON.parse(row.data);
      Object.entries(data).forEach(([key, value]) => {
        if (!['hash', 'title'].includes(key)) {
          const capitalizedKey = key.replace(/\b\w/g, l => l.toUpperCase());
          if (!categories[capitalizedKey]) categories[capitalizedKey] = new Set();
          if (Array.isArray(value)) {
            value.forEach(item => {
              const processedItem = item === null || item === '' ? 'Other' : item;
              categories[capitalizedKey].add(processedItem);
            });
          } else {
            const processedValue = value === null || value === '' ? 'Other' : value;
            categories[capitalizedKey].add(processedValue);
          }
        }
      });
    });

    // Convert Sets to sorted Arrays
    Object.keys(categories).forEach(key => {
      categories[key] = Array.from(categories[key]).sort((a, b) => {
        // Check if both 'a' and 'b' are strings
        if (typeof a === 'string' && typeof b === 'string') {
          return a.toLowerCase().localeCompare(b.toLowerCase());
        }
        return 0; 
      });
    });

    console.log('Categories:', categories);
    res.json(categories);
  });

  db.close();
});

app.get('/api/category-mappings', (req, res) => {
  const db = new sqlite3.Database(dbPath);
  db.all("SELECT main_category, sub_category FROM category_mappings", [], (err, rows) => {
    if (err) {
      console.error('Error fetching category mappings:', err);
      res.status(500).json({ error: err.message });
      return;
    }
    const mappings = rows.map(row => ({
      main_category: row.main_category,
      sub_category: row.sub_category
    }));
    console.log('Category mappings:', mappings);
    res.json(mappings);
  });
  db.close();
});

app.post('/api/paper-count', (req, res) => {
  const db = new sqlite3.Database(dbPath);
  const userCriteria = req.body;

  console.log('Received user criteria:', userCriteria);

  if (!userCriteria || Object.keys(userCriteria).length === 0) {
    // If no criteria, return the total count of papers
    db.get("SELECT COUNT(*) as count FROM papers", [], (err, row) => {
      if (err) {
        console.error('Database error:', err);
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ count: row.count });
    });
    return;
  }

  let query = "SELECT COUNT(*) as count FROM papers WHERE ";
  let conditions = [];
  let params = [];

  Object.entries(userCriteria).forEach(([key, value]) => {
    console.log('Key:', key, 'Value:', value);
    const lowerKey = key.toLowerCase(); // Convert key to lowercase
    if (Array.isArray(value)) {
      // For array values, we need to check if any of the array elements match
      const subConditions = value.map(() => `json_extract(data, '$.${lowerKey}') LIKE ?`);
      conditions.push(`(${subConditions.join(' OR ')})`);
      params.push(...value.map(v => `%${v}%`));
    } else {
      conditions.push(`json_extract(data, '$.${lowerKey}') LIKE ?`);
      params.push(`%${value}%`);
    }
  });

  query += conditions.join(' AND ');

  console.log('Query:', query);
  console.log('Params:', params);

  db.get(query, params, (err, row) => {
    if (err) {
      console.error('Database error:', err);
      res.status(500).json({ error: err.message });
      return;
    }
    console.log('Query result:', row);
    res.json({ count: row ? row.count : 0 });
  });

  db.close();
});

app.post('/api/paper-count-for-option', (req, res) => {
  const db = new sqlite3.Database(dbPath);
  const { userCriteria, category, option } = req.body;

  console.log('Received request for paper count for option');
  console.log('User Criteria:', userCriteria);
  console.log('Category:', category);
  console.log('Option:', option);

  let query = "SELECT COUNT(*) as count FROM papers WHERE ";
  let conditions = [];
  let params = [];

  Object.entries(userCriteria).forEach(([key, value]) => {
    const lowerKey = key.toLowerCase();
    if (lowerKey !== category.toLowerCase()) {
      console.log('Processing user criteria - Key:', lowerKey, 'Value:', value);
      if (Array.isArray(value)) {
        const subConditions = value.map(() => `json_extract(data, '$.${lowerKey}') LIKE ?`);
        conditions.push(`(${subConditions.join(' OR ')})`);
        params.push(...value.map(v => `%${v}%`));
      } else {
        conditions.push(`json_extract(data, '$.${lowerKey}') LIKE ?`);
        params.push(`%${value}%`);
      }
    }
  });

  const lowerCategory = category.toLowerCase();
  conditions.push(`json_extract(data, '$.${lowerCategory}') LIKE ?`);
  params.push(`%${option}%`);

  query += conditions.join(' AND ');

  console.log('Final Query:', query);
  console.log('Final Params:', params);

  db.get(query, params, (err, row) => {
    if (err) {
      console.error('Database error:', err);
      res.status(500).json({ error: err.message });
      return;
    }
    console.log('Query result:', row);
    res.json({ count: row ? row.count : 0 });
  });

  db.close();
});

app.post('/api/paper-hashes', (req, res) => {
  const db = new sqlite3.Database(dbPath);
  const userCriteria = req.body;

  console.log('Received user criteria for hashes:', userCriteria);

  if (!userCriteria || Object.keys(userCriteria).length === 0) {
    db.all("SELECT hash FROM papers", [], (err, rows) => {
      if (err) {
        console.error('Database error:', err);
        res.status(500).json({ error: err.message });
        return;
      }
      const hashes = rows.map(row => row.hash);
      console.log('Hashes without criteria:', hashes);

      // Fetch descriptors for these hashes
      db.all("SELECT hash, data FROM descriptors WHERE hash IN (" + hashes.map(() => '?').join(',') + ")", hashes, (err, descriptorRows) => {
        if (err) {
          console.error('Database error:', err);
          res.status(500).json({ error: err.message });
          return;
        }
        const descriptors = descriptorRows.map(row => {
          let data = row.data.replace(/NaN/g, 'null'); // Replace NaN with null
          return { hash: row.hash, data: JSON.parse(data) };
        });
        res.json({ descriptors });
      });
    });
    return;
  }

  let query = "SELECT hash FROM papers WHERE ";
  let conditions = [];
  let params = [];

  Object.entries(userCriteria).forEach(([key, value]) => {
    const lowerKey = key.toLowerCase();
    if (Array.isArray(value)) {
      const subConditions = value.map(() => `json_extract(data, '$.${lowerKey}') LIKE ?`);
      conditions.push(`(${subConditions.join(' OR ')})`);
      params.push(...value.map(v => `%${v}%`));
    } else {
      conditions.push(`json_extract(data, '$.${lowerKey}') LIKE ?`);
      params.push(`%${value}%`);
    }
  });

  query += conditions.join(' AND ');

  console.log('Constructed query:', query);
  console.log('Query parameters:', params);

  db.all(query, params, (err, rows) => {
    if (err) {
      console.error('Database error:', err);
      res.status(500).json({ error: err.message });
      return;
    }
    const hashes = rows.map(row => row.hash);
    console.log('Hashes with criteria:', hashes);

    // Fetch descriptors for these hashes
    db.all("SELECT hash, data FROM descriptors WHERE hash IN (" + hashes.map(() => '?').join(',') + ")", hashes, (err, descriptorRows) => {
      if (err) {
        console.error('Database error:', err);
        res.status(500).json({ error: err.message });
        return;
      }
      const descriptors = descriptorRows.map(row => {
        let data = row.data.replace(/NaN/g, 'null'); // Replace NaN with null
        return { hash: row.hash, data: JSON.parse(data) };
      });
      res.json({ descriptors });
    });
  });

  db.close();
});

app.get('/api/paper/:hash', (req, res) => {
  const db = new sqlite3.Database(dbPath);
  const { hash } = req.params;

  db.get("SELECT data FROM papers WHERE hash = ?", [hash], (err, row) => {
    if (err) {
      console.error('Database error:', err);
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(404).json({ error: 'Paper not found' });
      return;
    }
    const paperData = JSON.parse(row.data);
    res.json(paperData);
  });

  db.close();
});

const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

app.post('/api/submit-feedback', (req, res) => {
  const { name, email, organization, feedback, rating } = req.body;

  const msg = {
    to: 'frederico@l4wb-i.org',
    from: 'admin@l4wb-i.org',
    subject: 'Policy Decision Tree - New Feedback Submission',
    text: `
      Name: ${name}
      Email: ${email}
      Organization: ${organization}
      Feedback: ${feedback}
      Rating: ${rating}/10
    `,
    html: `
      <h2>Policy Decision Tree - New Feedback Submission</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Organization:</strong> ${organization}</p>
      <p><strong>Feedback:</strong> ${feedback}</p>
      <p><strong>Rating:</strong> ${rating}/10</p>
    `,
  }

  sgMail
    .send(msg)
    .then(() => {
      console.log('Feedback email sent');
      res.status(200).json({ message: 'Feedback sent successfully' });
    })
    .catch((error) => {
      console.error('Error sending feedback email:', error);
      res.status(500).json({ error: 'Failed to send feedback' });
    });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
