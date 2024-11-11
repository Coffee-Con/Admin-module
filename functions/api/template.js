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
  // Insert data into the email_template table
  const query = 'INSERT INTO email_template (content) VALUES (?)';
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
    const query = 'DELETE FROM email_template WHERE id = ?;';
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
`Please generate the body of a phishing email based on the following title. This email is used for anti-phishing testing within the company. The email should include placeholders [name] and [link].

Title: Urgent: Please Update Your Company Account Information Immediately

Instructions:

The email must include the placeholders [name] and [link] for personalization.
The tone should be formal and urgent to prompt the recipient to click the link quickly.
Provide a plausible reason to make the recipient believe immediate action is required.
Example Title: Urgent: Please Update Your Company Account Information Immediately

Output:
Dear [name],

To enhance the security of our system, we are updating all employees' account information. Please click the following link and follow the instructions to complete the update:

[link]

Please ensure this is done within 24 hours, or your account will be temporarily disabled.

Thank you for your cooperation.

Best regards,
IT Support Team
——————————
Give me the text only. Don't say anything like: Here's the body of a phishing email based on the title:.
The following are the titles you need to use to generate content: `;

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

module.exports = { deleteTemplate, addTemplate, generateTemplate };