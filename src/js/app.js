import $ from 'jquery';
import {parseCode} from './code-analyzer';
//import * as flowchart from 'flowchart.js';
const flowchart = require('flowchart.js');
$(document).ready(function () {
    $('#codeSubmissionButton').click(() => {
        //let codeToParse = $('#codePlaceholder').val();
        //let parsedCode = parseCode(codeToParse);
        //$('#parsedCode').val(JSON.stringify(parsedCode, null, 2));

        let codeToParse = $('#codePlaceholder').val();
        let function_arguments = $('#argumentsPlaceholder').val();
        let graph_string = parseCode(codeToParse, function_arguments);
        draw_graph(graph_string);
    });
});

function draw_graph(graph_string){
    $('#diagram').empty()
    let diagram = flowchart.parse(graph_string);
    diagram.drawSVG('diagram');

    // you can also try to pass options:

    diagram.drawSVG('diagram', {
        'x': 0,
        'y': 0,
        'line-width': 3,
        'line-length': 100,
        'text-margin': 10,
        'font-size': 14,
        'font-color': 'black',
        'line-color': 'black',
        'element-color': 'black',
        'fill': 'white',
        'yes-text': 'T',
        'no-text': 'F',
        'arrow-end': 'block',
        'scale': 1,
        // style symbol types
        'symbols': {
            'start': {
                'font-color': 'red',
                'element-color': 'green',
                'fill': 'yellow'
            },
            'end':{
                'class': 'end-element',
                'font-color': '#00DE00'
            }
        },
        // even flowstate support ;-)
        'flowstate' : {
            // 'past' : { 'fill' : '#CCCCCC', 'font-size' : 12},
            // 'current' : {'fill' : 'yellow', 'font-color' : 'red', 'font-weight' : 'bold'},
            // 'future' : { 'fill' : '#FFFF99'},
            'true_path' : { 'fill' : '#00DE00'},
            // 'invalid': {'fill' : '#444444'},
            //'approved' : { 'fill' : '#58C4A3', 'font-size' : 12, 'yes-text' : 'APPROVED', 'no-text' : 'n/a' }
            // 'rejected' : { 'fill' : '#C45879', 'font-size' : 12, 'yes-text' : 'n/a', 'no-text' : 'REJECTED' }
        }
    });
}
