const { exec } = require('child_process');

// Run the exact curl command you requested
const curlCommand = `curl -i -X POST https://graph.facebook.com/v22.0/725554853964559/messages -H "Authorization: Bearer EAARZBQfP97HwBOwV1sdiuX4dQAYhcWlRwiu6EIt3XXgB8eR2njxF35LaBht2LTSeuLRyfVX2yqT3iLewzazuCwOdB4gij4nV1MjgTTZAxcNkRyKzW5Kg6q5NfScGhbRHC8TNzrMAMu5j5LevlZBdZBymNnILMw7JLNI08kTyTq0JiVyDKknIncCBRI0CtsKV0A9XZAyGzSpyxwOmRgZALEDCEtTAcnLDrwJEsZD" -H "Content-Type: application/json" -d "{\\"messaging_product\\": \\"whatsapp\\", \\"to\\": \\"919000283611\\", \\"type\\": \\"template\\", \\"template\\": {\\"name\\": \\"hello_world\\", \\"language\\": {\\"code\\": \\"en_US\\"}}}"`;

console.log('Running curl command...');
console.log('Command:', curlCommand);
console.log('\n--- RESPONSE ---');

exec(curlCommand, (error, stdout, stderr) => {
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  if (stderr) {
    console.error('Stderr:', stderr);
  }
  
  console.log(stdout);
});
