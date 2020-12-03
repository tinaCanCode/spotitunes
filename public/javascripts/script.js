// DOM Elements
//const axios = require('axios');

const favoriteBtn = document.querySelector("#favorite-btn");

document.addEventListener('DOMContentLoaded', () => {

  console.log('IronGenerator JS imported successfully!');

}, false);

// let stars=['one','two','three','four','five'];

// stars.forEach(function(star) {
//   document.getElementById(star).addEventListener("click", function(){
//     let checkingclass=document.getElementById(star).className;
//     if(checkingclass.includes("unchecked"))
//        {
//    document.getElementById(star).classList.remove("unchecked");
//   document.getElementById(star).classList.add("checked");
//       }
//     else
//       {
//   document.getElementById(star).classList.remove("checked");     
//   document.getElementById(star).classList.add("unchecked");
//       }
// });
// });



  document.getElementById('one').addEventListener("click", function(){
    let checkingclass=document.getElementById('one').className;
    if(checkingclass.includes("unchecked"))
       {
   document.getElementById('one').classList.remove("unchecked");
  document.getElementById('one').classList.add("checked");
      }
    else
      {
  document.getElementById('one').classList.remove("checked");     
  document.getElementById('one').classList.add("unchecked");
      }
});

document.getElementById('two').addEventListener("click", function(){
  let checkingclass=document.getElementById('two').className;
  if(checkingclass.includes("unchecked"))
     {
 document.getElementById('one').classList.remove("unchecked");
document.getElementById('one').classList.add("checked");
document.getElementById('two').classList.remove("unchecked");
document.getElementById('two').classList.add("checked");
    }
  else
    {
document.getElementById('one').classList.remove("checked");     
document.getElementById('one').classList.add("unchecked");
document.getElementById('two').classList.remove("checked");     
document.getElementById('two').classList.add("unchecked");
    }
});


document.getElementById('three').addEventListener("click", function(){
  let checkingclass=document.getElementById('three').className;
  if(checkingclass.includes("unchecked"))
     {
 document.getElementById('one').classList.remove("unchecked");
document.getElementById('one').classList.add("checked");
document.getElementById('two').classList.remove("unchecked");
document.getElementById('two').classList.add("checked");
document.getElementById('three').classList.remove("unchecked");
document.getElementById('three').classList.add("checked");
    }
  else
    {
document.getElementById('one').classList.remove("checked");     
document.getElementById('one').classList.add("unchecked");
document.getElementById('two').classList.remove("checked");     
document.getElementById('two').classList.add("unchecked");
document.getElementById('three').classList.remove("checked");     
document.getElementById('three').classList.add("unchecked");
    }
});


document.getElementById('four').addEventListener("click", function(){
  let checkingclass=document.getElementById('four').className;
  if(checkingclass.includes("unchecked"))
     {
 document.getElementById('one').classList.remove("unchecked");
document.getElementById('one').classList.add("checked");
document.getElementById('two').classList.remove("unchecked");
document.getElementById('two').classList.add("checked");
document.getElementById('three').classList.remove("unchecked");
document.getElementById('three').classList.add("checked");
document.getElementById('four').classList.remove("unchecked");
document.getElementById('four').classList.add("checked");
    }
  else
    {
document.getElementById('one').classList.remove("checked");     
document.getElementById('one').classList.add("unchecked");
document.getElementById('two').classList.remove("checked");     
document.getElementById('two').classList.add("unchecked");
document.getElementById('three').classList.remove("checked");     
document.getElementById('three').classList.add("unchecked");
document.getElementById('four').classList.remove("checked");     
document.getElementById('four').classList.add("unchecked");
    }
});


document.getElementById('five').addEventListener("click", function(){
  let checkingclass=document.getElementById('five').className;
  if(checkingclass.includes("unchecked"))
     {
 document.getElementById('one').classList.remove("unchecked");
document.getElementById('one').classList.add("checked");
document.getElementById('two').classList.remove("unchecked");
document.getElementById('two').classList.add("checked");
document.getElementById('three').classList.remove("unchecked");
document.getElementById('three').classList.add("checked");
document.getElementById('four').classList.remove("unchecked");
document.getElementById('four').classList.add("checked");
document.getElementById('five').classList.remove("unchecked");
document.getElementById('five').classList.add("checked");
    }
  else
    {
document.getElementById('one').classList.remove("checked");     
document.getElementById('one').classList.add("unchecked");
document.getElementById('two').classList.remove("checked");     
document.getElementById('two').classList.add("unchecked");
document.getElementById('three').classList.remove("checked");     
document.getElementById('three').classList.add("unchecked");
document.getElementById('four').classList.remove("checked");     
document.getElementById('four').classList.add("unchecked");
document.getElementById('five').classList.remove("checked");     
document.getElementById('five').classList.add("unchecked");
    }
});




// if (favoriteBtn != null) {
//   favoriteBtn.addEventListener("click", () => {
//     console.log("I was clicked")
//     const buttonId = favoriteBtn.getAttribute("id");
//     console.log(buttonId)
//   })
//}
