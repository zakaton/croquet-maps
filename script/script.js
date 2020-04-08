import View from "./view/View.js"
import Model from "./model/Model.js";

Croquet.startSession("croquet-maps-demo-27", Model, View)
    .then(session => {
        const {view, model} = session;
        console.log("session started")
        window.view = view;
    });