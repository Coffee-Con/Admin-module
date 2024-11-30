const mysql = require('mysql2');
const dbConfig = require('../dbConfig');
const connection = mysql.createConnection(dbConfig);

const { default: ollama } = require('ollama');

const addTemplate = (req, res) => {
  const { Subject, Content } = req.body;

  // Check if both subject and content are provided
  if (!Subject || !Content) {
    return res.status(400).json({ error: 'Subject and content are required.' });
  }
  // Insert data into the EmailTemplate table
  const query = 'INSERT INTO EmailTemplate (content) VALUES (?)';
  const contentJson = JSON.stringify({ subject: Subject, content: Content });

  connection.query(query, contentJson, (error, results) => {
    if (error) {
      console.error('Error inserting data:', error);
      return res.status(500).json({ error: 'Database error' });
    }
    console.log('Results:', results);
    res.json({ success: true, id: results.insertId });
  });
};

const deleteTemplate = (req, res) => {
    const templateId = req.params.id;
    const query = 'DELETE FROM EmailTemplate WHERE id = ?;';
    connection.query(query, [templateId], (err, results) => {
      if (err) {
        console.error('Error removing member:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ success: true });
  });
};

const generateTemplate = async (req, res) => {
  const userMessage = req.body.message;
  const predefinedText = 
`Generate a phishing email for anti-phishing training purposes using only the following placeholders: [name] for the recipient's name and [link] in [click]([link]) for the link. The email should:

- Begin with a personalized greeting using [name].
- Include a believable call to action with a sense of urgency or importance.
- Mimic common phishing scenarios such as account verification, payment issues, or password resets, while maintaining professionalism and formality.
- **Don't** use placeholders like [your name], [company name], or any other extraneous tags or entities.
- Ensure content is concise, realistic, and avoids repeated subjects.

Email Subject:`;

  try {
    const response = await ollama.chat({
      model: 'qwen2.5:0.5b', // change to 0.5b? to get info faster
      messages: [{ role: 'user', content: predefinedText + userMessage }],
    });
    res.json({ message: response.message.content });
  } catch (error) {
    console.error('Error calling ollama.chat:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const getTemplates = (req, res) => {
  const query = 'SELECT id, content FROM EmailTemplate';

  connection.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Database error', details: err });
    }
    // console.log('Templates:', results);
    res.json(results);
  });
};

const getTemplate = (req, res) => {
  const templateId = req.params.id;
  const query = 'SELECT content FROM EmailTemplate WHERE id = ?';

  connection.query(query, templateId, (err, results) => {
    if (err) {
      return res.status(500).json({ error: 'Database error', details: err });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }
    res.json(results[0]);
  });
}

module.exports = { deleteTemplate, addTemplate, generateTemplate, getTemplates, getTemplate };