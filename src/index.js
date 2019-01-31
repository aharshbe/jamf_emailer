import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

// Credentials for authenticate server side
require('dotenv').config()
var username = process.env.REACT_APP_JAMF_SESSION_USER
var password = process.env.REACT_APP_JAMF_SESSION_PASSWORD

// Creates authed headers for post request
let headers = new Headers();
headers.set('Authorization', 'Basic ' + Buffer.from(username + ":" + password).toString('base64'));

// Iterates over data from post request, and creates an array of dictionaries to return for the DnD views
const getItems = (count, offset = 0, data, keys) =>
Array.from({ length: count }, (v, k) => k).map(k => ({
  id: `${data[k]}-${offset[data[k]]}`,
  content: data[k],
  email: `${data[k]}@github.com`,
  handle: data[k],
  serialNumbers: offset[data[k]],
  emailed: "False"
}));

// Iterates over data sent via post request checking for users with more than one computer not compliant
const getItemsDupes = (count, offset = 0, data, keys) =>
Array.from({ length: count }, (v, k) => k).map(k => ({
    id: `${data[k]}-${offset[data[k]][0]}`,
    content:`${data[k]}: ${offset[data[k]].length}`,
    email: `${data[k]}@github.com`,
    handle: data[k],
    serialNumbers: offset[data[k]],
    emailed: "False"
}));



// Reorders resutls
const reorder = (list, startIndex, endIndex) => {
    const result = Array.from(list);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);

    return result;
};


// Moves an item from one list to another list.
const move = (source, destination, droppableSource, droppableDestination) => {
    const sourceClone = Array.from(source);
    const destClone = Array.from(destination);
    const [removed] = sourceClone.splice(droppableSource.index, 1);

    destClone.splice(droppableDestination.index, 0, removed);

    const result = {};
    result[droppableSource.droppableId] = sourceClone;
    result[droppableDestination.droppableId] = destClone;

    return result;
};

// Styling for the grid of objects on the array
const grid = 8
const getItemStyle = (isDragging, draggableStyle) => ({
    // some basic styles to make the items look a bit nicer
    userSelect: 'none',
    padding: grid * 2,
    margin: `0 0 ${grid}px 0`,

    // change background colour if dragging
    background: isDragging ? 'lightgreen' : 'white',

    // styles we need to apply on draggables
    ...draggableStyle
});

// Styling for the grid based on action
const getListStyle = isDraggingOver => ({
    background: isDraggingOver ? 'lightblue' : 'orange',
    padding: grid,
    width: 250
});

// Main app Component
class App extends Component {
  constructor(){
    super();
    // Creating state array of dictionaries
    this.state = {
        items: [],
        selected: [],
        both: [],
        compareData : [],
        removed : [],
        count: 0,
        countList: 0,
        countList2: 0,
        countEamiled: 0,
        userMultipls: {},
        emailedPeople: []
    };
    let dataSent = []
    let len = 0
    let keys = []

    // Fetch request to obtain data from server (server must be live on 3000 to work)
    fetch("http://localhost:3000/compare",{
      method: "GET",
      headers: headers
    })
    .then(
      res => res.json())
    .then(resData => {


      delete resData["Total_Not_In_Jamf"][1]["Total_Number_Not_In_Jamf"]
      len = resData["Total_Not_In_Jamf"][0]
      dataSent = resData["Total_Not_In_Jamf"][1]
      console.log(len);
      console.log(dataSent);
      keys = Object.keys(dataSent)
      var dict_people = {}
      var dict_people_sing = {}
      var dict_people_dupes = {}

      keys.forEach(function(i){
        if (dataSent[i] in dict_people){
          dict_people[dataSent[i]].push(i)
          dict_people_dupes[dataSent[i]] = dict_people[dataSent[i]]
          delete dict_people_sing[dataSent[i]]
        } else {
          dict_people[dataSent[i]] = [i]
          dict_people_sing[dataSent[i]] = i
        }
      });

      keys = Object.keys(dict_people_sing)

      // Set states and send data to function getItems and getItemsDupes
      this.setState({items : getItems(keys.length, dict_people_sing, keys)})
      this.setState({count : len})
      this.setState({userMultipls: dict_people})
      this.setState({countList: keys.length})

      keys = Object.keys(dict_people_dupes)
      this.setState({selected : getItemsDupes(keys.length, dict_people_dupes, keys)})
      this.setState({countList2: keys.length})
      this.setState({both: dict_people})

    })
  }

    /**
     * A semi-generic way to handle multiple lists. Matches
     * the IDs of the droppable container to the names of the
     * source arrays stored in the state.
     */
    id2List = {
        droppable: 'items',
        droppable2: 'selected',
        removed: ''
    };

    getList = id => this.state[this.id2List[id]];
    onDragEnd = result => {
        const { source, destination } = result;

        // dropped outside the list
        if (!destination) {
            this.trashit(this.getList(source.droppableId),
            this.getList(source.droppableId)[source.index].id,
            source, "removed", source.droppableId)
            return;
        }
        if (source.droppableId === destination.droppableId) {
            const items = reorder(
                this.getList(source.droppableId),
                source.index,
                destination.index
            );
            let state = { items };
            if (source.droppableId === 'droppable2') {
                state = { selected: items };
            }
            this.setState(state);
        } else {
            console.log(source.droppableId);

            // Get the count of items in each droppable object
            if (source.droppableId === "droppable"){
              this.setState({countList : this.getList(source.droppableId).length - 1})
              this.setState({countList2 : this.getList("droppable2").length + 1})
            } else {
              this.setState({countList2 : this.getList(source.droppableId).length - 1})
              this.setState({countList : this.getList("droppable").length + 1})
            }
            const result = move(
                this.getList(source.droppableId),
                this.getList(destination.droppableId),
                source,
                destination
            );
            this.getList(source.droppableId)[source.index].emailed = "True"
            this.setState({
                items: result.droppable,
                selected: result.droppable2,
            });
        }
    };

    // Handle email request when button is clicked
    handleEntailmentRequest(e, handle, email, serials) {
      e.preventDefault();
      this.email(handle, email, serials)
      console.log("handle request ");
    }

    // Handle email request when email all button is pressed
    handleEntailmentRequestAll(e, items) {
      e.preventDefault();
      var r = window.confirm('Are you sure you want to email all '+this.state.count+' people?')
      if (r){
        var keys = Object.keys(items)
        var toSend = []
        var s = ''
        for (var i in keys){
          var handle = keys[i]
          var toEmail = items[keys[i]]
          var tmp = ""
          for (var x in toEmail){
             tmp = `${handle} ${handle}@github.com ${toEmail[x]}`
             s += `${handle} ${handle}@github.com ${toEmail[x]}`
             toSend.push(tmp)
             tmp = ""
          }
        }
        this.emailNoWarn(s, toSend)
      } else {
        console.log("Cancelled");
      }
      console.log("handle request ");
    }

  // Sleep function not currently used but may be
  sleep(milliseconds) {
    var start = new Date().getTime();
    for (var i = 0; i < 1e7; i++) {
      if ((new Date().getTime() - start) > milliseconds){
        break;
      }
    }
  }
  // Map serial numbers to create user clickable buttons
  mapSerials(handle, email, serials){
    var children = []
    if (typeof serials === "object"){
      for (var i in serials){
        children.push(<li key={serials[i] + i}><button onClick={(e)=>{this.handleEntailmentRequest(e, handle, email, serials)}}>{serials[i]}</button></li>)
      }
    } else {
      children.push(<p key={serials}><button onClick={(e)=>{this.handleEntailmentRequest(e, handle, email, serials)}}>{serials}</button></p>)
      return children
    }
    return children
  }
  // Create list of users that were previously emailed for tracking purposes
  mapEmailed(object){
      var children = []
        for (var i in object){
          children.push(<li key={object[i] + i}>{object[i]}</li>)
        }
      return children
    }
    email(handle, email, serial){
      console.log("Clicked email")
      var r = window.confirm('Want to email this person?')
      if (r){
        var s = handle + " " + email + " " + serial
        console.log(s);
        var arr = this.state.emailedPeople
        arr.push(s)
        this.setState({emailedPeople: arr})
        fetch(`http://localhost:3000/emailer`, { method: "POST", headers: headers, body : s })
        console.log("emailed "+email);
        var emailCountTemp = this.state.countEamiled
        emailCountTemp += 1
        this.setState({countEamiled : emailCountTemp})
      } else {
        console.log("Cancelled");
      }
    }
    emailNoWarn(s, emails){
      this.setState({emailedPeople: emails})
      console.log(emails);
      fetch(`http://localhost:3000/emailer_bulk`, { method: "POST", headers: headers, body : s })
      this.setState({countEamiled : emails.length})
    }

    // Render function to return HTML
    render() {
      // Url to look up user handle via Gear (need interal apps access to get to Gear url)
        var url = "https://gear.githubapp.com/users/"
        return (
            <DragDropContext onDragEnd={this.onDragEnd}>
            <div>
              <div>
                <button onClick={(e)=>{this.handleEntailmentRequestAll(e, this.state.both)}}
                >Email all <span role="img" aria-label="emailedSingle">📨 </span>=><span role="img" aria-label="emailedPackage">📦</span>
                </button>
              </div>
              <hr></hr>
              <p>Total not in JAMF: <b>{this.state.count}</b></p>
              <hr></hr>
              <p>Single endpoint email: <b>{this.state.countList}</b></p>
              <hr></hr>
              <p>Multiple endpoint email: <b>{this.state.countList2}</b></p>
              <hr></hr>
              <p>Total <span role="img" aria-label="emailNumber">📮</span>: <b>{this.state.countEamiled}</b></p>
              <hr></hr>
              <div>Emailed People <span role="img" aria-label="emailedPeople">📩</span>:
                <p>{this.mapEmailed(this.state.emailedPeople)}</p>
              </div>
            </div>
                <Droppable droppableId="droppable">
                    {(provided, snapshot) => (
                        <div
                            ref={provided.innerRef}
                            style={getListStyle(snapshot.isDraggingOver)}>
                            {this.state.items.map((item, index) => (
                                <Draggable
                                    key={item.id}
                                    draggableId={item.id}
                                    index={index}>
                                    {(provided, snapshot) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            {...provided.dragHandleProps}
                                            style={getItemStyle(
                                                snapshot.isDragging,
                                                provided.draggableProps.style
                                            )}>
                                            <a href={url+item.handle} target="_blank" rel="noopener noreferrer">{item.content}</a>
                                            <ul>
                                              {this.mapSerials(item.handle, item.email, item.serialNumbers)}
                                            </ul>
                                        </div>
                                    )}
                                </Draggable>
                            ))}
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>
                <Droppable droppableId="droppable2">
                    {(provided, snapshot) => (
                        <div
                            ref={provided.innerRef}
                            style={getListStyle(snapshot.isDraggingOver)}>
                            {this.state.selected.map((item, index) => (
                                <Draggable
                                    key={item.id}
                                    draggableId={item.id}
                                    index={index}>
                                    {(provided, snapshot) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            {...provided.dragHandleProps}
                                            style={getItemStyle(
                                                snapshot.isDragging,
                                                provided.draggableProps.style
                                            )}>
                                            <a href={url+item.handle} target="_blank" rel="noopener noreferrer">{item.content}</a>
                                            <ul>
                                              {this.mapSerials(item.handle, item.email, item.serialNumbers)}
                                            </ul>
                                        </div>
                                    )}
                                </Draggable>
                            ))}
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>
            </DragDropContext>
        );
    }
}

// Put the things into the DOM!
ReactDOM.render(<App />, document.getElementById('root'));
