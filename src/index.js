import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

// Credentials for authenticate server side
require('dotenv').config()
var username = process.env.REACT_APP_JAMF_SESSION_USER
var password = process.env.REACT_APP_JAMF_SESSION_PASSWORD

let headers = new Headers();
headers.set('Authorization', 'Basic ' + Buffer.from(username + ":" + password).toString('base64'));


const getItems = (count, offset = 0, data, keys) =>
    Array.from({ length: count }, (v, k) => k).map(k => ({
        id: `item-${k + data[k]}`,
        content: `${offset[data[k]]}:` + ` ${data[k]}`,
        email: `${offset[data[k]]}@github.com`,
        handle: offset[data[k]],
        serialNumber: data[k]
    }));



// a little function to help us with reordering the result
const reorder = (list, startIndex, endIndex) => {
    const result = Array.from(list);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);

    return result;
};

/**
 * Moves an item from one list to another list.
 */
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

const grid = 8

const getItemStyle = (isDragging, draggableStyle) => ({
    // some basic styles to make the items look a bit nicer
    userSelect: 'none',
    padding: grid * 2,
    margin: `0 0 ${grid}px 0`,

    // change background colour if dragging
    background: isDragging ? 'lightgreen' : 'grey',

    // styles we need to apply on draggables
    ...draggableStyle
});

const getListStyle = isDraggingOver => ({
    background: isDraggingOver ? 'lightblue' : 'lightgrey',
    padding: grid,
    width: 250
});


class App extends Component {
  constructor(){
    super();
    this.state = {
        items: [],
        selected: [],
        compareData : []
    };
    let dataSent = []
    let len = 0
    let keys = []

    fetch("http://localhost:3000/compare",{
      method: "GET",
      headers: headers
    })
    .then(
      res => res.json())
    .then(resData => {
      //delete resData["Total_Not_In_Jamf"][1]["Total_Number_Not_In_Jamf"]
      // test
      resData["Total_Not_In_Jamf"][1]["Total_Number_Not_In_Jamf"] = "aharshbe"

      len = resData["Total_Not_In_Jamf"][0]
      dataSent = resData["Total_Not_In_Jamf"][1]
      console.log(len);
      console.log(dataSent);

      keys = Object.keys(dataSent)
      this.setState({items : getItems(len, dataSent, keys)})

    })
  }

    /**
     * A semi-generic way to handle multiple lists. Matches
     * the IDs of the droppable container to the names of the
     * source arrays stored in the state.
     */
    id2List = {
        droppable: 'items',
        droppable2: 'selected'
    };

    getList = id => this.state[this.id2List[id]];

    onDragEnd = result => {
        const { source, destination } = result;

        // dropped outside the list
        if (!destination) {
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
            const result = move(
                this.getList(source.droppableId),
                this.getList(destination.droppableId),
                source,
                destination
            );
            this.email(this.getList(source.droppableId)[source.index].handle,
            this.getList(source.droppableId)[source.index].email,
            this.getList(source.droppableId)[source.index].serialNumber)
            this.setState({
                items: result.droppable,
                selected: result.droppable2
            });
        }
    };


    email(handle, email, serial){
      console.log("Clicked email");
      var r = window.confirm('Want to email this person?')
      if (r){
        var s = handle + " " + email + " " + serial
        console.log(s);
        fetch(`http://localhost:3000/emailer`, { method: "POST", headers: headers, body : s })
        console.log("emailed "+email);
      } else {
        console.log("Cancelled");
      }

    }

    ruleout(){
      console.log("Clicked rule out");
    }
    // Normally you would want to split things out into separate components.
    // But in this example everything is just done in one place for simplicity
    render() {

        return (
            <DragDropContext onDragEnd={this.onDragEnd}>
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
                                            {item.content}
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
                                            {item.content}
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
