import {Layout, plot, stack} from "nodeplotlib";
import {PLOT_DEFAULT_WIDTH} from "../config";


export function AddTitle(string) {
  let layout : Layout = {width: PLOT_DEFAULT_WIDTH, height:100, title: string, xaxis:{visible:false}, yaxis:{visible:false}}
  stack([{}],layout)
}

