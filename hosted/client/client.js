/* Takes in an error message. Sets the error message up in html, and
   displays it to the user. Will be hidden by other events that could
   end in an error.
*/
const socket = io();

const handleError = (message) => {
  document.getElementById('errorMessage').textContent = message;
  document.getElementById('domoMessage').classList.remove('hidden');
};

/* Sends post requests to the server using fetch. Will look for various
   entries in the response JSON object, and will handle them appropriately.
*/
const sendPost = async (url, data) => {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();
  document.getElementById('domoMessage').classList.add('hidden');

  if(result.redirect) {
    window.location = result.redirect;
  }

  if(result.error) {
    handleError(result.error);
  }
};

const updateTable = async (msg) => {
  //Message contains the data needed to rebuild the page, the only difference is the current player

  //Since rendering the page requires the player,  another call needs to be made to get the player
  let data = {
    name: document.querySelector("#playerName").innerHTML
  }
  const response = await fetch('/getPlayer', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  const curPlayer = response;
  const table =  msg.table;
  const players = msg.players;
  sendPost('/tableUpdate',{players,table,curPlayer});
  //This will send a post request, which goes to the router, which takes it to the tables controller which now
  //Uses the pre-loaded data sent with the request to re-render the table page
};

const handleEditBox = () => {
  const editForm = document.getElementById('editForm');
  const editBox = document.getElementById('editBox');
  const channelSelect = document.getElementById('channelSelect');

  editForm.addEventListener('submit', (e) => {
      e.preventDefault();

      if(editBox.value) {            
          const data = {
              message: editBox.value,
              channel: channelSelect.value,
          };

          socket.emit('chat message', data);
          editBox.value = '';
      }
  });
};
/* Entry point of our client code. Runs when window.onload fires.
   Sets up the event listeners for each form across the whole app.
*/
const init = async() => {

  const signupForm = document.getElementById('signupForm');
  const loginForm = document.getElementById('loginForm');
  const domoForm = document.getElementById('domoForm');
  const tableForm = document.getElementById('tableForm');
  const domoMessage = document.getElementById('domoMessage');
  const ch = document.getElementById('tableName');
  const recursive = document.getElementById('updateBlock');

  if(ch && !recursive){
    debugger;
    //if this is the table page, then you have joined the table page, send a ping to everyone that you have joined
    //but first, subscribe to the table's channel and always update if you receive anything on it
    socket.on(`${ch}`, updateTable);
    //Since you have joined, you should update everyone

    //Doc should have the json that represents a table,
    //An array of JSON player objects
    //And an array of JSON spectator objects
    let t = JSON.parse(document.querySelector("#secretT").innerHTML);
    debugger;
    let pDoc = [];
    let p = document.querySelectorAll('.pBlock');
    for(let i=0;i<p.length;i++){
      pDoc.push(JSON.parse(p[i].innerHTML))
    };

    //For some reason this doesn't work
    /*
    for (let i = 0; i < t.players.length; i++) {
      //Since rendering the page requires the player,  another call needs to be made to get the player
    let data = {
      name: t.players[i]
    };
    debugger;
    try{
    const r = await fetch('/getPlayer', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  const response = await r.json();
  }catch(err){
    console.log(err);
  }
  debugger;
    //response will be the players json object
    //Add it to the list
    pDoc.push(response);
    }
    debugger;
    */
    let doc = {
      table: t,
      players: pDoc,
      update: true
    };
    //From T, we can get the players list
    //By calling /getPlayer a ton of times we can get players out of it too
    //do the same for the spectators and the JSON object is recreated
    socket.emit('tUpdate', doc)

  }else if(ch && recursive){
    socket.on(`${ch}`, updateTable);
  }
  /* If this page has the signupForm, add it's submit event listener.
     Event listener will grab the username, password, and password2
     from the form, validate everything is correct, and then will
     use (sendPost to send the data to the server.
  */
  if(signupForm) {
    signupForm.addEventListener('submit', (e) => {
      e.preventDefault();
      domoMessage.classList.add('hidden');

      const username = signupForm.querySelector('#user').value;
      const pass = signupForm.querySelector('#pass').value;
      const pass2 = signupForm.querySelector('#pass2').value;

      if(!username || !pass || !pass2) {
        handleError('All fields are required!');
        return false;
      } 

      if(pass !== pass2) {
        handleError('Passwords do not match!');
        return false;
      }

      sendPost(signupForm.getAttribute('action'), {username, pass, pass2});
      return false;
    });
  }

  /* If this page has the loginForm, add it's submit event listener.
     Event listener will grab the username, password, from the form, 
     validate both values have been entered, and will use sendPost 
     to send the data to the server.
  */
  if(loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      domoMessage.classList.add('hidden');

      const username = loginForm.querySelector('#user').value;
      const pass = loginForm.querySelector('#pass').value;

      if(!username || !pass) {
        handleError('Username or password is empty!');
        return false;
      }

      sendPost(loginForm.getAttribute('action'), {username, pass});
      return false;
    });
  }

  /* If this page has the domoForm, add it's submit event listener.
     Event listener will grab the domo name and the domo age from
     the form. It will throw an error if one or both are missing.
     Otherwise, it will send the request to the server.
  */
  if(domoForm) {
    domoForm.addEventListener('submit', (e) => {
      e.preventDefault();
      domoMessage.classList.add('hidden');

      const name = domoForm.querySelector('#domoName').value;
      const age = domoForm.querySelector('#domoAge').value;

      if(!name || !age) {
        handleError('All fields are required!');
        return false;
      }

      sendPost(domoForm.getAttribute('action'), {name, age});
      return false;
    });

      tableForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const table = tableForm.querySelector('#tableSelect').value;

      sendPost(tableForm.getAttribute('action'), {table});
      return false;
    });


  }
};

// Call init when the window loads.
window.onload = init;