//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const date = require(__dirname + "/date.js");
const _= require("lodash");
require("dotenv").config();

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

const mongo_URI=process.env.mongo_connect_uri;

//creating mongoose connection
mongoose.connect(mongo_URI);

const itemSchema= new mongoose.Schema({
  name:String
});

const Item= mongoose.model("Item",itemSchema);

const listSchema=new mongoose.Schema({
  name:String,
  items:[itemSchema]
});

const List=mongoose.model("List",listSchema);

const item1=new Item({
  name:"Cook Breakfast"
});

const item2= new Item({
  name:"Buy grocery"
});

const item3= new Item({
  name:"Leave for work"
});

const defaultItems=[item1,item2,item3];

app.get("/", function(req, res) {

// const day = date.getDate();

Item.find({}).then( (items)=>{
  if(items.length===0){
    Item.insertMany(defaultItems).then( ()=>{
      console.log("Items successfully inserted");
    }).catch((error)=>{
      console.error("Error detected:",error);
    });
    res.redirect("/");
  }
  else{
    res.render("list", {listTitle: "Today", newListItems: items});
}
}).catch((error)=>{
  console.error("Error detected:",error);
});

});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName=req.body.list;

  const newItem= new Item({
    name:itemName
  });

  if(listName==="Today"){
    newItem.save();
    res.redirect("/");
  }
  else{
    List.findOne({name:listName}).then((foundList)=>{
      foundList.items.push(newItem);
      foundList.save();
      res.redirect("/"+listName);
    })
  }

  // if (req.body.list === "Work") {
  //   workItems.push(item);
  //   res.redirect("/work");
  // } else {
  //   items.push(item);
  //   res.redirect("/");
  // }
});

app.post("/delete",(req,res)=>{
  const itemId=req.body.checkbox;
  const listName=req.body.listName;

  if(listName==="Today"){
    Item.findByIdAndRemove(itemId).then((docs)=>{
      console.log("Document deleted:",docs);
      res.redirect("/");
    }).catch((error)=>{
      console.error("Error detected:",error);
    })
  }
  else{
    List.findOneAndUpdate({name:listName},{$pull:{items:{_id:itemId}}}).then( (foundList)=>{
      if(foundList!=null){
        res.redirect("/"+listName);
      }
    })
  }
  

});

app.get("/:customListName", function(req,res){
  // res.render("list", {listTitle: "Work List", newListItems: workItems});
  const customListName=_.capitalize(req.params.customListName);

  List.findOne({name:customListName})
  .then(function(foundList){
      
        if(foundList===null){
          const list = new List({
            name:customListName,
            items:defaultItems
          });
        
          list.save();
          console.log("saved");
          res.redirect("/"+customListName);
        }
        else{
          res.render("list",{listTitle:foundList.name, newListItems:foundList.items});
        }
  })
  .catch(function(err){});

});

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(process.env.PORT||3000, function() {
  console.log("Server started on port 3000");
});
