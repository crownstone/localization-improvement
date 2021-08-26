import {Plot, plot, stack} from "nodeplotlib";

let x = [-100, -85,-75]

let data : Plot[] = [
  {x:x, y:[70,	68,	61], marker:{color:"#f00"}, name:"Alex	 NaiveBayesian"},
  {x:x, y:[66,	64,	63], marker:{color:"#0f0"}, name:"Suus	 NaiveBayesian"},
  {x:x, y:[66,	63,	55], marker:{color:"#abc"}, name:"tel1	 NaiveBayesian"},
  {x:x, y:[59,	54,	50], marker:{color:"#00f"}, name:"tel2	 NaiveBayesian"},
  {x:x, y:[31,	24,	33], marker:{color:"#f0f"}, name:"tel3	 NaiveBayesian"},
]

stack(data,{height:600})
let datalnn : Plot[] = [
  {x:x, y:[59,	58,	61], marker:{color:"#f00"},  name:"Alex	 KNN", },
  {x:x, y:[63,	64,	59], marker:{color:"#0f0"},  name:"Suus	 KNN"},
  {x:x, y:[61,	61,	60], marker:{color:"#abc"},  name:"tel1	 KNN"},
  {x:x, y:[62,	63,	59], marker:{color:"#00f"},  name:"tel2	 KNN"},
  {x:x, y:[56,	57,	54], marker:{color:"#f0f"},  name:"tel3	 KNN"},
]

plot(datalnn,{height:600})