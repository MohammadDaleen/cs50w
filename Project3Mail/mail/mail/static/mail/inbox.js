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
  document.querySelector('#email-view').style.display = 'none';
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

    // Send mail details in post request to server
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
  document.querySelector('#email-view').style.display = 'none';
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';

  // Get emails view from document
  emailsView = document.querySelector('#emails-view');

  /* Show the mailbox name */
  // Ensure mailboxName exists
  if (mailboxName = document.querySelector('#emails-view-title')){
    mailboxName.innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
  }
  // mailboxName doesn't exist
  else {
    // Create mailboxName
    mailboxName = document.createElement('h3');
    // Set id attribute of mailbox name
    mailboxName.id = 'emails-view-title';
    // Set innerHTML of mailbox name
    mailboxName.innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
  }
  
  // Add mailboxName to emailsView
  emailsView.append(mailboxName);

  // Request mailbox details in get request to server
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
      // Print emails
      console.log(emails);
      
      /* Show the emails */
      // Ensure emailsDiv exists
      if (emailsDiv = document.querySelector('#emails')){
        // Set innerHTML of emailsDiv
        emailsDiv.innerHTML = '';
      } 
      // emailsDiv doesn't exist
      else {
        /* Create emailsDiv element */
        emailsDiv = document.createElement('div');
        // Set class attribute of emailsDiv
        emailsDiv.className = 'list-group';
        // Set id attribute of emailsDiv
        emailsDiv.id = 'emails';
        // Set innerHTML of emailsDiv
        emailsDiv.innerHTML = '';
      }

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
        // Set type attribute of email
        email.type = 'button';
        // Add event listener to email (on click)
        email.addEventListener('click', () => email_view(`${email_JSON.id}`));

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
        // Add email to emailsdiv
        emailsDiv.append(email);
        // Add emailsDiv to emailsView
        emailsView.append(emailsDiv);
      });
  });

}

/* View Email: When a user clicks on an email, the user should be taken to a view where they see the content of that email. */
function email_view(id) {
  
  // Show the email view and hide other views
  document.querySelector('#email-view').style.display = 'block';
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';

  // Request email details in get request to server
  fetch(`/emails/${id}`)
  .then(response => response.json())
  .then(email => {
    console.log(email);

    // Your application should show the email's sender, recipients, subject, timestamp, and body.
    emailView = document.querySelector('#email-view');
    emailView.innerHTML = '';
    
    subject = document.createElement('h4');
    subject.className = 'font-weight-normal';
    subject.innerHTML = `${email.subject}`;
    emailView.append(subject);

    header = document.createElement('div')
    header.className = 'd-flex justify-content-between';

    sender = document.createElement('div');
    sender.className = 'font-weight-bold';
    sender.innerHTML = `${email.sender}`;
    header.append(sender);

    timestamp = document.createElement('div');
    timestamp.innerHTML = `${email.timestamp}`;
    header.append(timestamp);

    emailView.append(header);

    recipients = document.createElement('small');
    recipients.innerHTML = `${email.recipients}`;
    emailView.append(recipients);

    body = document.createElement('div');
    body.className = 'pt-2';
    body.innerHTML = `${email.body}`;
    emailView.append(body);

    // Ensure email is not read
    if (email.read == false){
      // Send mail details in put request to server
      fetch(`/emails/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
            read: true
        })
      })
    }
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