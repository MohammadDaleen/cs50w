document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');

});

/* Send Mail: When a user submits the email composition form, send the email. */
function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';

  // Send the email when the form is submitted
  document.querySelector('#send-mail').addEventListener('click', (event) => {
    
    // Stop form from submitting
    event.preventDefault();

    // send mail details in post request to server
    fetch('/emails', {
      method: 'POST',
      body: JSON.stringify({
        recipients: document.querySelector('#compose-recipients').value,
        subject: document.querySelector('#compose-subject').value,
        body: document.querySelector('#compose-body').value
      })
    })
    // Turn response to JSON
    .then(response => response.json())
    .then(result => {
      // Check for any error
      const noError = 'error' in result ? false : true;
      // Ensure result is true
      if (noError){
        // Load the user's sent mailbox
        load_mailbox('sent');
      }
    })
  })
}

/* Mailbox: When a user visits their Inbox, Sent mailbox, or Archive, load the appropriate mailbox. */
function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view-title').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
  
  // Request mailbox details in get request to server
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
      // Print emails
      console.log(emails);

      document.querySelector('#emails').innerHTML = '';

      // Loop over emails
      emails.forEach(email_JSON => {
      
        // Get the characteristics of email 
        let isBold = !email_JSON.read;
        let isBlack = !email_JSON.read;
        let isMuted = email_JSON.read;

        /* Create email element */
        const email = document.createElement('button');
        // Set class attribute of email
        email.className = `btn btn-light list-group-item list-group-item-action ${isMuted ? 'bg-light' : ''}`;
        // Set id attribute of email
        email.id = `${email_JSON.id}`;

        /* Create row element */
        const row = document.createElement('div');
        // Set class attribute of row
        row.className = 'row';

        /* Create sender element */
        const sender = document.createElement('div');
        // Set class attribute of sender
        sender.className = `col-4 text-dark ${isBold ? 'font-weight-bold' : ''}`;
        // Set innerHTML of sender
        sender.innerHTML = `${email_JSON.sender}`;
        // Add sender to row
        row.append(sender);
        
        /* Create subject element */
        const subject = document.createElement('div');
        // Set class attribute of subject
        subject.className = `col-5 text-dark text-truncate ${isBold ? 'font-weight-bold' : ''}`;
        // Set innerHTML of subject
        subject.innerHTML = `${email_JSON.subject}`;
        // Add subject to row
        row.append(subject);

        /* Create body element */
        const body = document.createElement('span');
        // Set class attribute of body
        body.className = 'text-secodary text-truncate p-0 font-weight-normal';
        // Set innerHTML of body
        body.innerHTML = `${" "} - ${email_JSON.body}`;
        // Add body to subject
        subject.append(body);

        /* Create timestamp element */
        const timestamp = document.createElement('div');
        // Set class attribute of timestamp
        timestamp.className = `col-3 text-right ${isBold ? 'font-weight-bold' : ''} ${isBlack ? 'text-dark' : ''}`;
        // Set innerHTML of timestamp
        timestamp.innerHTML = `${email_JSON.timestamp}`;
        // Add timestamp to row
        row.append(timestamp);

        // Add row to email
        email.append(row);
        // Add email to DOM
        document.querySelector('#emails').append(email);
      });
  });

}

let foo = {
  "id": 100,
  "sender": "foo@example.com",
  "recipients": ["bar@example.com"],
  "subject": "Hello!",
  "body": "Hello, world!",
  "timestamp": "Jan 2 2020, 12:00 AM",
  "read": false,
  "archived": false
}