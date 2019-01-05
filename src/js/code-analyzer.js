import * as esprima from 'esprima';

const parseCode = (codeToParse, function_arguments) => {
    let parsedCode = esprima.parseScript(codeToParse, { loc: true });
    initialize_data(parsedCode);
    evaluate_code(function_arguments);
    add_strings_to_graph();
    get_true_path(graph_nodes, 0);
    add_nodes_to_graph(graph_nodes);
    add_paths_to_graph(graph_nodes);
    return final_graph_string;
};

export{initialize_data};
export {parseCode};

let argument_with_values = {};
let symbolTable = [];
let relevant_lines = [];
let params = [];
let isElse = false;
let tabs = 0;
let graph_nodes = [];
let graph_string = '';
let final_graph_string = '';
let node_count = 1;
let op_count = 0;
let cond_count = 0;
let current_row_type = '';
let conditions = {};
//let outer_conditions = [];
//let inner_conditions = [];
//let before_substitution = true;

let math_it_up = {
    '+': function (x, y) { return x + y; },
    '-': function (x, y) { return x - y; },
    '*': function (x, y) { return x * y; },
    '/': function (x, y) { return x / y; }
};
/*
function check_if_assignment(current_line){
    if(current_line.type == 'assignment'){
        update_variable(current_line);
    }
}*/
function evaluate_conditions(lines){
    for(let i = 0; i < lines.length; i++) {
        let current_line = lines[i];
        let if_result = false;
        if (current_line.type == 'if statement' || current_line.type == 'else if statement' ||
      current_line.type == 'while statement'){
            if_result = evaluate_if(current_line);
            check_true_or_false(if_result, current_line);
            evaluate_conditions(current_line.statements);
        }
        //check_if_assignmreplace_variables_with_valuesent(current_line);
    }
}
function check_true_or_false(if_result, current_line){
    if(if_result) {
        true_condition(current_line);
    }
}
/*function update_variable(line){
    let value = replace_variables_with_values(line.value);
    if(line.array_index != undefined){
        argument_with_values[line.name][line.array_index] = value;
    }
    else {
        argument_with_values[line.name] = value;
    }
}*/
function true_condition(line){
    line.isTrue = true;
}
function evaluate_code(function_arguments){
    function_arguments = function_arguments.trim();
    let argument_values = function_arguments.split(',');
    let param_index = 0;
    for(let i = 0; i < argument_values.length; i++){
        if(argument_values[i][0] == '['){ // array element
            let j = 1;
            let new_array = new Array();
            new_array.push(argument_values[i].substring(1));
            while(!argument_values[i+j].includes(']')){
                new_array.push(argument_values[i+j]);
                j++;}
            new_array.push(argument_values[i+j].substring(0, argument_values[i+j].length - 1));
            argument_with_values[params[param_index]] = new_array;
            i += j;}
        else{argument_with_values[params[param_index]] = argument_values[i];}
        param_index ++;
    }
    evaluate_conditions(relevant_lines);
}
function evaluate_if(line){
    let if_statement = line.value;
    let string_to_evaluate = '';
    if(if_statement.left != undefined){
        let left_side = if_statement.left.toString().replace(/\s/g, '');
        let operator = if_statement.operator;
        let right_side = if_statement.right.toString().replace(/\s/g, '');
        let splitted_left = left_side.split('');
        let splitted_right = right_side.split('');
        evaluate_one_side_predicate(splitted_left);
        evaluate_one_side_predicate(splitted_right);
        string_to_evaluate = splitted_left.join('') + operator + splitted_right.join('');
    }
    else{ // single variable in condition
        if_statement = evaluate_single_predicate(if_statement);
        string_to_evaluate = if_statement;
    }
    //string_to_evaluate = replace_variables_with_values(string_to_evaluate);
    return eval(string_to_evaluate);
}
/*function replace_variables_with_values(string_to_evaluate){
    let changed = true;
    while(changed){
        changed = false;
        for(let key in argument_with_values){
            if(string_to_evaluate.toString().includes(key)){
                string_to_evaluate = string_to_evaluate.replace(key, argument_with_values[key]);
                changed = true;
            }
        }
    }
    return string_to_evaluate;
}*/
function evaluate_single_predicate(condition){
    if(condition.charAt(0) == '!'){
    //if(condition.substring(1) in argument_with_values){
        condition = '!' + argument_with_values[condition.substring(1)];
    //}
    }
    else if(condition in argument_with_values) { // if(condition in argument_with_values)
        condition = argument_with_values[condition];
    }

    return condition;
}
function evaluate_one_side_predicate(side){
    for(let i = 0; i < side.length; i++) {
        if (side[i] in argument_with_values){
            if(Array.isArray(argument_with_values[side[i]])){
                let array_index = '';
                let j = 2;
                while(side[i+j] != ']'){
                    array_index += side[i+j];
                    j++;
                }
                side[i] = argument_with_values[side[i]][array_index];
                side.splice(i+1,2+array_index.length);
            }
            else{
                side[i] = argument_with_values[side[i]];
            }
        }
    }
}
function initialize_data(parsedCode) {
    argument_with_values = {};
    symbolTable = [];
    params = [];
    relevant_lines = [];
    isElse = false;
    tabs = 0;
    graph_nodes = [];
    graph_string = '';
    final_graph_string = '';
    node_count = 1;
    op_count = 0;
    cond_count = 0;
    current_row_type = '';
    conditions = {};
    //outer_conditions = [];
    //inner_conditions = [];
    traverse(parsedCode);
}


const map_to_type_true_path = {
    'if statement': add_if_statement_true_path,
    'else if statement': add_else_if_statement_true_path,
    'while statement': add_while_statement_true_path,
    'before_while': add_while_statement_true_path,
    'in_cond_assignment': in_condition_assignment_true_path,
    'assignment': add_assignment_true_path
};
function add_assignment_true_path(current_node){
    current_node.color = true;
}
function add_if_statement_true_path(current_node, conditions_level){
    if(current_node.cond != undefined){ // inner if
        for(let j = 0; j < conditions[conditions_level-1].length; j++){
            if(conditions[conditions_level-1][j].name == current_node.cond){
                current_node.color = conditions[conditions_level-1][j].isTrue;
                if(current_node.color == false){
                    current_node.isTrue = conditions[conditions_level-1][j].isTrue;
                }
            }
        }
    }
    else{
        current_node.color = true;
    }
    conditions[conditions_level].push({'type': current_node.type, 'name': current_node.node_name, 'isTrue': current_node.isTrue, 'line': current_node.line, 'color': current_node.color});
    get_true_path(current_node.child_nodes, conditions_level + 1);
}
function add_while_statement_true_path(current_node, conditions_level){
    if(current_node.cond != undefined){ // inner while
        for(let j = 0; j < conditions[conditions_level-1].length; j++){
            if(conditions[conditions_level-1][j].name == current_node.cond){
                current_node.color = conditions[conditions_level-1][j].isTrue;
            }
        }
    }
    else{
        current_node.color = true;
    }
    if(current_node.type == 'while statement'){
        conditions[conditions_level].push({'type': current_node.type, 'name': current_node.node_name, 'isTrue': current_node.isTrue, 'line': current_node.line, 'color': current_node.color});
        get_true_path(current_node.child_nodes, conditions_level + 1);
    }
}

function add_else_if_statement_true_path3(current_node){
    //let is_green = true;
    //for (let j = 0; j < conditions[conditions_level].length; j++) {
    //if (conditions[conditions_level][j].isTrue) {
    //    is_green = false;
    //}
    //}
    //if (is_green) {
    current_node.color = true;
    //}
    //else {
    //    current_node.color = false;
    //}
}
function add_else_if_statement_true_path2(current_node, conditions_level){
    for(let j = 0; j < conditions[conditions_level-1].length; j++){
        if(conditions[conditions_level-1][j].name == current_node.cond){
            current_node.color = conditions[conditions_level-1][j].isTrue;
            //if(current_node.color == false){
            //    current_node.isTrue = conditions[conditions_level-1][j].isTrue;
            //}
            //else{ // check previous inner conditions
            add_else_if_statement_true_path3(current_node, conditions_level);
            //}
        }
    }
}
function add_else_if_statement_true_path(current_node, conditions_level){
    if(current_node.cond == undefined) { // not inner else if statement
        let is_green = true;
        for (let j = 0; j < conditions[conditions_level].length; j++) {
            if (conditions[conditions_level][j].isTrue) {
                is_green = false;
            }
        }
        if (is_green) {
            current_node.color = true;
        }
        else {
            current_node.color = false;        }
    }
    else{
        add_else_if_statement_true_path2(current_node, conditions_level);
    }
    conditions[conditions_level].push({'type': current_node.type, 'name': current_node.node_name, 'isTrue': current_node.isTrue, 'line': current_node.line, 'color': current_node.color});
    get_true_path(current_node.child_nodes, conditions_level + 1);
}

function else_statement4(current_node){
    //let is_green = true;
    //for (let j = 0; j < conditions[conditions_level].length; j++) {
    //    if (conditions[conditions_level][j].isTrue) {
    //        is_green = false;
    //    }
    //}
    //if (is_green) {
    //    current_node.color = true;
    //}
    //else {
    current_node.color = false;
    //}
}
function else_statement2(current_node, conditions_level){
    for(let j = 0; j < conditions[conditions_level-1].length; j++){
        if(conditions[conditions_level-1][j].name == current_node.grandparent_cond_name){
            current_node.color = conditions[conditions_level-1][j].isTrue;
            //if(current_node.color){
            else_statement4(current_node, conditions_level);
            //}
            //else if(current_node.color == false){
            //    current_node.isTrue = conditions[conditions_level-1][j].isTrue;
            //}
        }
    }
}

function else_statement3(current_node, conditions_level){
    let is_green = true;
    for (let j = 0; j < conditions[conditions_level-1].length; j++) {
        if (conditions[conditions_level-1][j].isTrue) {
            is_green = false;
        }
    }
    if (is_green) {
        current_node.color = true;
    }
    else {
        current_node.color = false;
    }
}
function else_statement(current_node, conditions_level){
    if(current_node.grandparent_cond_name == undefined) {
        if(conditions_level == 0){
            conditions_level ++;
        }
        else_statement3(current_node, conditions_level);
    }
    else{
        else_statement2(current_node, conditions_level);
    }
}
function in_condition_assignment_true_path3(current_node, is_green) {
    if (is_green) {
        current_node.color = true;
    }
    else {
        current_node.color = false;
    }
}
function in_condition_assignment_true_path2(current_node, conditions_level){
    if(current_node.color && current_node.cond_type == 'else if statement'){
        let is_green = true;
        for (let j = 0; j < conditions[conditions_level - 1].length - 1; j++) {
            if (conditions[conditions_level - 1][j].isTrue) {
                is_green = false;
            }
        }
        in_condition_assignment_true_path3(current_node, is_green);
    }
}
function in_condition_assignment_true_path(current_node, conditions_level){
    if(!current_node.isElse){
        for(let j = 0; j < conditions[conditions_level - 1].length; j++){
            if(conditions[conditions_level - 1][j].name == current_node.cond){
                current_node.color = conditions[conditions_level - 1][j].isTrue;
                current_node.cond_type = conditions[conditions_level - 1][j].type;
            }
        }
        in_condition_assignment_true_path2(current_node, conditions_level);
    }
    else{ // is in else statement
        else_statement(current_node, conditions_level);
    }
}
function get_true_path(nodes, conditions_level){ // get the path that is received from given input
    if(conditions[conditions_level] == undefined){
        conditions[conditions_level] = [];
    }
    for(let i = 0; i < nodes.length; i++){
        let current_node = nodes[i];
        let line_type = current_node.type;
        if(line_type == 'return' || line_type == 'before_return'){
            continue;
        }
        map_to_type_true_path[line_type](current_node, conditions_level);
    }
}


const map_to_type_add_node = {
    'if statement': add_if_condition_node,
    'else if statement': add_else_if_condition_node,
    'else': add_else_if_statement_true_path,
    'while statement': add_while_condition_node,
    'before_while': add_while_condition_node,
    'in_cond_assignment': add_cond_assignment_node,
    'assignment': add_assignment_node,
    'return': add_return_node,
    'before_return': add_return_node
};
function add_assignment_node(node){
    final_graph_string += node.node_string + '|true_path\n';
}
function add_cond_assignment_node(node){
    if(node.color){
        final_graph_string += node.node_string + '|true_path\n';
    }
    else{
        final_graph_string += node.node_string;
    }
}
function add_if_condition_node(node){
    if(node.color){
        final_graph_string += node.node_string + '|true_path\n';
    }
    else{
        final_graph_string += node.node_string;
    }
    add_nodes_to_graph(node.child_nodes);
}
function add_else_if_condition_node(node){
    if(node.color){
        final_graph_string += node.node_string + '|true_path\n';
    }
    else{
        final_graph_string += node.node_string;
    }
    add_nodes_to_graph(node.child_nodes);
}
function add_return_node(node){
    final_graph_string += node.node_string + '|true_path\n';
}
function add_while_condition_node(node){
    final_graph_string += node.node_string + '|true_path\n';
    if(node.type == 'while statement'){
        add_nodes_to_graph(node.child_nodes);
    }
}
function add_nodes_to_graph(nodes){
    for(let i = 0; i < nodes.length; i++){
        let current_node = nodes[i];
        let line_type = current_node.type;
        map_to_type_add_node[line_type](current_node);
    }
}

function add_return_direction2(return_node, current_node){
    if(current_node.final && current_node.inWhile == undefined){
        final_graph_string += current_node.node_name + '->' + 'before_return' + '\n';
    }
}
function add_assignment_direction(node, next_node, isLastElement){
    node.final = true;
    //if(node.cond == undefined){ // not in condition
    if(next_node == undefined && node.inWhile == undefined){ // last node and not in while
        final_graph_string += node.node_name + '->before_return\n';
    }
    else if(node.inWhile != undefined && isLastElement) { // in while condition
        final_graph_string += node.node_name + '->before_while\n';
    }
    else{
        final_graph_string += node.node_name + '->' + next_node.node_name + '\n';
    }
}
function add_return_direction(node){
    for(let i = 0; i < graph_nodes.length; i++){
        let current_node = graph_nodes[i];
        if((graph_nodes[i].type == 'assignment' || graph_nodes[i].type == 'in_cond_assignment')){
            add_return_direction2(node, current_node);
        }
    }
    final_graph_string += 'before_return->' + node.node_name + '\n';
}
function add_before_while_direction(before_while_node, while_node){
    final_graph_string += before_while_node.node_name + '->' + while_node.node_name + '\n';
}
function add_if_direction(node, first_child_node, next_node){
    final_graph_string += node.node_name + '(yes)->' + first_child_node.node_name + '\n';

    if(next_node != undefined){
        final_graph_string += node.node_name + '(no)->' + next_node.node_name + '\n';
    }
    else if(node.inWhile) {
        final_graph_string += node.node_name + '(no)->before_while\n';
    }
    else{
        final_graph_string += node.node_name + '(no)->before_return\n';
    }
}

function assignment_or_return_path(node, next_node, isLastElement){
    if(node.type == 'assignment' || node.type == 'in_cond_assignment'){
        add_assignment_direction(node, next_node, isLastElement);
    }
    else if(node.type == 'return'){
        add_return_direction(node);
    }
}
function if_path(nodes, i, node, next_node){
    if(node.type == 'if statement') {
        if (node.cond == undefined) {
            for (let j = 0; j < i; j++) {
                if (nodes[j].type == 'assignment') {
                    nodes[j].final = false;
                }
            }
        }
        add_if_direction(node, node.child_nodes[0], next_node);
        add_paths_to_graph(node.child_nodes);
    }
}
function while_path(nodes, i, node, next_node){
    if(node.type == 'while statement') {
        if (node.cond == undefined) {
            for (let j = 0; j < i; j++) {
                if (nodes[j].type == 'assignment') {
                    nodes[j].final = false;
                }
            }
        }
        add_if_direction(node, node.child_nodes[0], next_node);
        add_paths_to_graph(node.child_nodes);
    }
}
function add_paths_to_graph(nodes){
    for(let i = 0; i < nodes.length; i++){
        let current_node = nodes[i];
        //let line_type = current_node.type;
        //map_to_type_add_path[line_type](current_node);
        assignment_or_return_path(nodes[i], nodes[i + 1], i == nodes.length - 1);
        if_path(nodes, i, current_node, nodes[i+1]);
        while_path(nodes, i, current_node, nodes[i+1]);
        if(current_node.type == 'else if statement'){
            add_if_direction(current_node, current_node.child_nodes[0], nodes[i+1]);
            add_paths_to_graph(current_node.child_nodes);
        }
        else if(current_node.type == 'before_while'){
            add_before_while_direction(current_node, graph_nodes[i + 1]);
        }

    }
}


const map_to_type_graph = {
    'if statement': add_if_statement_graph,
    'else if statement': add_else_if_statement_graph,
    'else': add_else_statement_graph,
    'while statement': add_while_statement_graph,
    'return': add_return_statement_graph,
    'assignment': add_assignment_graph
};
function add_strings_to_graph(){
    for(let i = 0; i < relevant_lines.length; i++){
        let line_type = relevant_lines[i].type;
        let next_type = '';
        if(i < relevant_lines.length - 1){
            next_type = relevant_lines[i +1].type;
        }
        map_to_type_graph[line_type](relevant_lines[i], next_type);
    }
}
//isElse
function add_if_statement_graph(relevant_line, next_statement_type, child_nodes, cond_name){
    let if_statement = '';
    if(relevant_line.value.left != undefined){
        if_statement = relevant_line.display_value.left + ' ' + relevant_line.display_value.operator + ' ' + relevant_line.display_value.right;
    }
    else{
        if_statement = relevant_line.value;
    }
    graph_string = 'cond' + cond_count +'=>condition: <<' + node_count + '>>\n' + if_statement + '\n';
    relevant_line.node_string = graph_string;
    node_count++;
    relevant_line.node_name = 'cond' + cond_count;
    cond_count++;
    relevant_line.cond = cond_name;
    relevant_line.child_nodes = [];
    if(child_nodes != undefined){child_nodes.push(relevant_line);}
    else{graph_nodes.push(relevant_line);    }
    current_row_type = relevant_line.type;
    add_all_predicate_statements(relevant_line, relevant_line.child_nodes);
}
//isElse
function add_else_if_statement_graph(relevant_line, next_statement_type, child_nodes, cond_name){
    let else_if_statement = '';
    if(relevant_line.value.left != undefined) {
        else_if_statement = relevant_line.display_value.left + ' ' + relevant_line.display_value.operator + ' ' + relevant_line.display_value.right;
    }
    else{else_if_statement = relevant_line.value;}
    graph_string = 'cond' + cond_count +'=>condition: <<' + node_count + '>>\n' + else_if_statement + '\n';
    relevant_line.node_string = graph_string;
    node_count++;
    relevant_line.node_name = 'cond' + cond_count;
    relevant_line.cond = cond_name;
    relevant_line.child_nodes = [];
    if(child_nodes != undefined){
        child_nodes.push(relevant_line);}
    else {graph_nodes.push(relevant_line);}
    current_row_type = relevant_line.type;
    relevant_line.prev_cond = 'cond' + (cond_count - 1);
    cond_count++;
    add_all_predicate_statements(relevant_line, relevant_line.child_nodes);
}
function add_else_statement_graph(relevant_line, next_statement_type, child_nodes, parent_node_name){
    relevant_line.parent_cond_name = parent_node_name;
    current_row_type = 'else';
    add_all_predicate_statements(relevant_line, child_nodes, ('cond' + (cond_count - 1))); // send with prev condition
}
function add_while_statement_graph(relevant_line, next_statement_type, child_nodes, cond_name){
    let while_statement = '';
    //if(relevant_line.value.left != undefined){
    while_statement = relevant_line.display_value.left + ' ' + relevant_line.display_value.operator + ' ' + relevant_line.display_value.right;
    //}
    //else{while_statement = relevant_line.value;}
    graph_string = 'before_while=>operation: <<' + node_count + '>>\nNULL\n';
    node_count++;
    relevant_line.cond = cond_name;
    graph_nodes.push({'type':'before_while', 'node_name':'before_while', 'node_string': graph_string});
    graph_string = 'cond' + cond_count +'=>condition: <<' + node_count + '>>\n' + while_statement + '\n';
    relevant_line.node_string = graph_string;
    node_count++;
    relevant_line.node_name = 'cond' + cond_count;
    cond_count++;
    relevant_line.child_nodes = [];
    if(child_nodes != undefined){child_nodes.push(relevant_line);}
    else {graph_nodes.push(relevant_line);}
    current_row_type = relevant_line.type;
    add_all_predicate_statements(relevant_line, relevant_line.child_nodes, 'while_statement');}
function add_return_statement_graph(relevant_line){
    graph_string = 'before_return=>end: _\n';
    graph_nodes.push({'type':'before_return', 'node_name':'before_return', 'node_string': graph_string});
    graph_string = 'e=>operation: <<'+ node_count +'>>\n return ' + relevant_line.display_value + '\n';
    relevant_line.node_string = graph_string;
    node_count++;
    relevant_line.node_name = 'e';
    graph_nodes.push(relevant_line);
}
function add_assignment_graph(relevant_line, next_type, child_nodes, node_name, isElse){
    let name = '';
    if(relevant_line['array_index'] != undefined){
        name = relevant_line.name + '['+relevant_line.array_index+']';
    }
    else{
        name =  relevant_line.name;
    }
    let update_assignment = false;
    if(relevant_line.display_value.includes('++') || relevant_line.display_value.includes('--')){
        update_assignment = true;
    }
    if(node_name == undefined){
        not_in_condition_assignment(relevant_line, next_type, child_nodes, name, update_assignment);
    }
    else{
        in_condition_assignment(relevant_line, next_type, child_nodes, name, node_name, isElse, update_assignment);
    }
    current_row_type = relevant_line.type;
}
function not_in_condition_assignment_new_node(relevant_line, next_type, child_nodes, name, update_assignment){
    if(update_assignment){
        graph_string = 'op' + op_count + '=>operation: <<'+ node_count +'>>\n' + relevant_line.display_value + '\n';
    }
    else{
        graph_string = 'op' + op_count + '=>operation: <<'+ node_count +'>>\n' + name + ' = ' + relevant_line.display_value + '\n';
    }
    if(next_type != 'assignment'){
        relevant_line.node_string = graph_string;
        relevant_line.node_name = 'op' + op_count;
        op_count++;
        //if(child_nodes != undefined){
        //    child_nodes.push(relevant_line);
        //}
        //else {
        graph_nodes.push(relevant_line);
        //}
        node_count++;
    }
}
function not_in_condition_assignment(relevant_line, next_type, child_nodes, name, update_assignment){
    if(current_row_type == 'assignment'){ // add assignment or decalaration to exist node
        if(update_assignment){
            graph_string += relevant_line.display_value + '\n';
        }
        else{
            graph_string += name + ' = ' + relevant_line.display_value + '\n';        }
        if(next_type != 'assignment'){
            relevant_line.node_string = graph_string;
            relevant_line.node_name = 'op' + op_count;
            op_count++;
            //if(child_nodes != undefined){
            //    child_nodes.push(relevant_line);
            //}            //else {
            graph_nodes.push(relevant_line);
            //}
            node_count++;            }    }
    else{ // new node for assignment or declaration
        not_in_condition_assignment_new_node(relevant_line, next_type, child_nodes, name, update_assignment);    }
}
function in_condition_assignment_new_node(relevant_line, next_type, child_nodes, name, node_name, isElse, update_assignment){
    if(update_assignment){
        graph_string = 'op' + op_count + '=>operation: <<'+ node_count +'>>\n' + relevant_line.display_value + '\n';    }
    else{
        graph_string = 'op' + op_count + '=>operation: <<'+ node_count +'>>\n' + name + ' = ' + relevant_line.display_value + '\n';    }
    if(next_type != 'assignment') {
        node_count++;
        relevant_line.node_string = graph_string;
        relevant_line.node_name = 'op' + op_count;
        relevant_line.type = 'in_cond_assignment';
        op_count++;
        relevant_line.cond = node_name;
        relevant_line.isElse = isElse;
        if(isElse){            relevant_line.parent_cond_name = node_name;        }
        if(child_nodes != undefined){            child_nodes.push(relevant_line);        }
        else {
            graph_nodes.push(relevant_line);
        }
    }
}
function in_condition_assignment2(relevant_line, next_type, child_nodes, name, node_name, isElse, update_assignment){
    let current_string = '';
    if(update_assignment){
        current_string = relevant_line.display_value + '\n';
    }
    else{
        current_string = name + ' = ' + relevant_line.display_value + '\n';
    }
    return current_string;
}
function in_condition_assignment(relevant_line, next_type, child_nodes, name, node_name, isElse, update_assignment){
    if(current_row_type == 'assignment'){ // add assignment or decalaration to exist node
        graph_string += in_condition_assignment2(relevant_line, next_type, child_nodes, name, node_name, isElse, update_assignment);
        if(next_type != 'assignment'){
            relevant_line.node_string = graph_string;
            relevant_line.node_name = 'op' + op_count;
            op_count++;
            relevant_line.type = 'in_cond_assignment';
            relevant_line.cond = node_name;
            relevant_line.isElse = isElse;
            //if(isElse){
            //    relevant_line.parent_cond_name = node_name;            }            //if(child_nodes != undefined){
            child_nodes.push(relevant_line);
            //}
            //else {
            //    graph_nodes.push(relevant_line);            //}
            node_count++;        }    }
    else{ // new node for assignment or declaration
        in_condition_assignment_new_node(relevant_line, next_type, child_nodes, name, node_name, isElse, update_assignment);    }
}
function add_all_predicate_statements2(statement, relevant_line, child_nodes, prev_cond_node_name, statement_type, next_statement_type){
    if(prev_cond_node_name == undefined){ // if or else if statement
        if(relevant_line.inWhile){
            statement.inWhile = true;
        }
        map_to_type_graph[statement_type](statement, next_statement_type, child_nodes, relevant_line.node_name, false);
    }

    else if(prev_cond_node_name == 'while_statement'){
        statement.inWhile = true;
        map_to_type_graph[statement_type](statement, next_statement_type, child_nodes, relevant_line.node_name, false);
    }
    else{ // else statement
        //if(relevant_line.inWhile){
        //    statement.inWhile = true;
        //}
        map_to_type_graph[statement_type](statement, next_statement_type, child_nodes, prev_cond_node_name,  true);
    }
}
function add_all_predicate_statements(relevant_line, child_nodes, prev_cond_node_name){
    let statements = relevant_line.statements;
    for (let j = 0; j < statements.length; j++){
        let statement_type = statements[j].type;
        if(relevant_line.parent_cond_name != undefined){
            statements[j].grandparent_cond_name = relevant_line.parent_cond_name;
        }
        if(statements[j].type == 'assignment'){
            statements[j].isTrue = relevant_line.isTrue;
        }
        let next_statement_type = '';
        if(j < statements.length - 1){
            next_statement_type = statements[j + 1].type;
        }
        add_all_predicate_statements2(statements[j], relevant_line, child_nodes, prev_cond_node_name, statement_type, next_statement_type);
    }
}
function traverse(o) {
    functions_or_expressions_or_return(o);
    if_while_statements(o);
    all_variables(o);
    let if_or_while = check_not_if_and_not_while(o);
    for (var i in o) {
        if (o[i] !== null && typeof(o[i]) == 'object' && if_or_while){traverse(o[i]);}
    }
}
function check_not_if_and_not_while(o){
    if(o.type =='IfStatement'){
        return false;
    }
    if(o.type == 'WhileStatement'){
        return false;
    }
    return true;
}
function functions_or_expressions_or_return(o) {
    //if (o['type'] == 'FunctionDeclaration') {
    //    function_dec(o);
    //}
    if (o['type'] == 'ExpressionStatement') {
        expression(o);
    }
    else if (o['type'] == 'ReturnStatement') {
        returnstmt(o);
    }
}
//function function_dec(o){
//relevant_lines.push({'line': o.loc.start.line, 'type': 'function declaration', 'name': o.id.name, 'tabs': tabs});
//tabs += 1;
//}
function if_while_statements(o){
    for (var i in o) {
        if (o[i] == 'WhileStatement' || o[i] == 'IfStatement') {
            stmts(o);
        }
    }
}
function all_variables(o){
    for (var i in o) {
        if (i == 'params') {
            param(o);
        }
        else if(i == 'declarations'){
            declaration(o);
        }
    }
}

function param(o){
    for (var i in o.params) {
        params.push(o.params[i].name);
        symbolTable.push({'name': o.params[i].name, 'value': o.params[i].name});
    }
}
function display_array_value(elements){

    let display_value = '[';
    let j = 0;
    for(j = 0; j < elements.length - 1; j++){
        display_value +=  elements[j] + ',';
    }
    display_value += elements[j] + ']';
    return display_value;
}
function declaration(o){
    for (var i in o.declarations) {
        let value = '';
        let display_value = '';
        if(o.declarations[i].init != null) {
            value = right_expression(o.declarations[i].init);
            if(o.declarations[i].init.type =='ArrayExpression'){
                display_value = display_array_value(o.declarations[i].init.elements);
            }
            else{
                display_value = right_expression(o.declarations[i].init, undefined, true);
            }
        }
        let line = o.declarations[i].loc.start.line;
        relevant_lines.push({'line':line,'type': 'assignment', 'name': o.declarations[i].id.name, 'value': value, 'display_value': display_value});
        symbolTable.push({'line': o.declarations[i].loc.start.line, 'name': o.declarations[i].id.name, 'value': value});
    }
}

function returnstmt(object, statements){
    let values = return_expression(object, statements);
    let value = values[0];
    let display_value = values[1];
    //if(statements != undefined){
    //    statements.push({'line': object.argument.loc.start.line, 'type': 'return', 'value': value, 'display_value': display_value});
    //}
    //else{
    relevant_lines.push({'line': object.argument.loc.start.line, 'type': 'return', 'value': value, 'display_value': display_value});
    //}
}
function return_expression(object, statements){
    let value = '';
    let display_value = '';
    let element = object['argument'];
    if(element.type == 'BinaryExpression'){
        value = right_expression(element.left, statements) + ' ' + element.operator + ' ' + right_expression(element.right, statements);
        display_value = right_expression(element.left, statements, true) + ' ' + element.operator + ' ' + right_expression(element.right, statements, true);
    }
    else if(element.type == 'MemberExpression'){
        value = member_right_expression(element, statements);
        display_value = member_right_expression(element, statements, true);
    }
    else{
        value = single_element(element, statements);
        display_value = single_element(element, statements, true);
    }
    return [value, display_value];
}
function update_expression(exp){
    let variable = exp.argument.name;
    let value = '';
    let display_value = '';
    if(exp.operator == '++'){
        value = variable + ' + 1';
        display_value = variable + '++';
    }
    else if(exp.operator == '--'){
        value = variable + ' - 1';
        display_value = variable + '--';
    }
    return [variable, value, display_value];
}
function expression(object, statements){
    let exp = object['expression'];
    let variable = '';
    let value = '';
    let display_value = '';
    if(exp.type == 'UpdateExpression'){
        let var_with_value = update_expression(exp);
        variable = var_with_value[0];
        value = var_with_value[1];
        display_value = var_with_value[2];    }
    else{value = right_expression(exp.right, statements);
        display_value = right_expression(exp.right, undefined, true);
        variable = get_variable(exp);}
    if(variable.indexOf('[')>-1){ //update value in array
        handle_array_expression(exp, variable, value, display_value, statements);}
    else{ // not array
        if(statements != undefined){
            statements.push({'line': object['expression'].loc.start.line, 'name': variable, 'type': 'assignment', 'value': value, 'display_value': display_value});        }
        else {            relevant_lines.push({'line': exp.loc.start.line, 'name': variable, 'type': 'assignment', 'value': value, 'display_value': display_value});        }    }
}

function insert_relevant_expression(exp, name, value, display_value, index, statements){
    let var_index = check_sym_table(name);
    if(statements != undefined){
        statements.push({'line': exp.loc.start.line, 'name': name, 'type': 'assignment', 'value': value, 'display_value': display_value, 'tabs': tabs, 'array_index': index});
    }
    else {
        relevant_lines.push({'line': exp.loc.start.line, 'name': name, 'type': 'assignment', 'value': value, 'display_value': display_value, 'tabs': tabs, 'array_index': index});
        symbolTable[var_index].value[index] = value;
    }
}
function get_array_indices(splitted_variable){
    let left_array_index = '';
    let right_array_index = '';
    for(let k=0;k<splitted_variable.length;k++){
        if(splitted_variable[k] == '['){
            left_array_index = k;        }
        if(splitted_variable[k] == ']'){
            right_array_index = k;        }
    }
    return [left_array_index, right_array_index];
}
function handle_array_expression(exp, variable, value, display_value, statements){
    let splitted_variable = variable.split('');
    let array_indices = get_array_indices(splitted_variable);
    let left_array_index = array_indices[0];
    let right_array_index = array_indices[1];
    let name = variable.substring(0, left_array_index);
    let index = variable.substring(left_array_index + 1, right_array_index);
    insert_relevant_expression(exp, name, value, display_value, index, statements);
}

function get_variable(object){
    if(object.left.type == 'MemberExpression'){
        return (single_element(object.left.object) + '[' + right_expression(object.left.property) + ']');
    }
    else {
        return object.left.name;
    }
}

function right_expression(object, statements, display_value){
    if (object.type == 'BinaryExpression'){
        return binaryExpression(object, statements, display_value);
    }
    else if(object.type == 'MemberExpression'){
        return member_right_expression(object, statements, display_value);
    }
    else if(object.type == 'ArrayExpression'){
        for(let i =0;i<object.elements.length;i++){
            object.elements[i] = single_element(object.elements[i], display_value);
        }
        return object.elements;
    }
    else return single_element(object, statements, display_value);
}
function check_if_var_in_sym_table(name){
    let found = false;
    let inner_index = -1;
    for(let j=0; j< symbolTable.length;j++){
        if(symbolTable[j].name == name){
            found = true;
            inner_index = j;
        }
    }
    return [found, inner_index];
}
function check_if_array_member(object, statements, member_exp, inner_index, i, name){
    if(params.includes(name)) {
        return member_exp;
    }
    else{
        return single_element(symbolTable[inner_index].value[i]);
    }
}
//display value
function member_right_expression(object, statements, display_value){
    let name = '';
    let index = '';
    name = single_element(object.object, statements);
    index = single_element(object.property, statements);
    let member_exp = name + '[' + index + ']';
    if(display_value){
        return member_exp;    }
    let is_in_sym = check_if_var_in_sym_table(name);
    let found = is_in_sym[0];
    let inner_index = is_in_sym[1];
    if (found) {
        for(let i = 0; i < symbolTable[inner_index].value.length; i++){
            if(i == index){
                return check_if_array_member(object, statements, member_exp, inner_index, i, name);
            }
        }
    }
    return member_exp;
}
function get_numbers_and_variables(elements){
    let numbers = '';
    let variables = '';
    for (let i = 0; i < elements.length; i++) {
        if (i % 2 == 0) {
            if (isNaN(elements[i])) {
                variables += elements[i] + ' ';}
            else {
                numbers += elements[i] + ' ';}
        }
        else {
            if (isNaN(elements[i + 1])) {
                variables += elements[i] + ' ';
            }
            else {
                numbers += elements[i] + ' ';}
        }
    }
    return [numbers, variables];
}
function eval_numbers(elements) {
    let numbers_and_variables = get_numbers_and_variables(elements);
    let numbers = numbers_and_variables[0];
    let variables = numbers_and_variables[1];
    //if(numbers.split(' ').length > 2){
    return numbers_to_evaluate(variables, numbers);
    //}
    //else{
    //    return variables + ' ' + numbers;
    //}
}
function numbers_to_evaluate(variables, numbers){
    if(variables.charAt(0) === '+'){
        variables = variables.substr(2);
    }
    //if (numbers.charAt(0) === '*' || numbers.charAt(0) === '/'){
    //    numbers = numbers.substr(2);
    //}
    //let numbers_evaluated = eval(numbers);
    //if(numbers_evaluated.toString().charAt(0) == '-'){
    //    return variables + numbers_evaluated;
    //}
    //else{
    return variables + ' + ' + eval(numbers);
    //}
}
function remove_empty_chars(all_exp){
    for(let i = 0; i < all_exp.length; i++){
        if(all_exp[i] == ''){
            all_exp.splice(i, 1);
        }
    }
}
function evaluate_binary_exp(object, statements, left, right){
    let operators = '*/';
    if((!isNaN(left)) && (!isNaN(right))){
        return math_it_up[object.operator](Number(right_expression(object.left, statements)), Number(right_expression(object.right, statements)));
    }
    else if(operators.includes(object.operator) && left.length>2){
        return '('+right_expression(object.left, statements) + ') ' + object.operator + ' ' + right_expression(object.right, statements);
    }
    else return (right_expression(object.left, statements) + ' ' + object.operator + ' ' + right_expression(object.right, statements));
}
function binaryExpression(object, statements, display_value) {
    let left = '';
    let right = '';
    if(display_value){
        left = right_expression(object.left, statements, display_value);
        right = right_expression(object.right, statements, display_value);
        return left + object.operator + right;    }
    else {left = right_expression(object.left, statements).toString().trim();
        right = right_expression(object.right, statements).toString().trim();
        let elements = left.toString().split(' ');
        let right_element_with_op = (object.operator + ' ' + right);
        right_element_with_op = right_element_with_op.replace(/\s+/g, ' ');
        let splitted_right = right_element_with_op.split(' ');
        let all_exp = elements.concat(splitted_right);
        remove_empty_chars(all_exp);
        if ((object.operator == '+' || object.operator == '-') && all_exp.length > 3) {
            let eval_exp = eval_numbers(all_exp);
            return eval_exp;}else {
            return evaluate_binary_exp(object, statements, left, right);}}
}

function single_element(object, statements, display_value){
    if(!isNaN(object)){
        return object;
    }
    if(object.type=='UnaryExpression'){
        return (object.operator + single_element(object.argument));
    }
    else if (object.type=='Literal'){
        return object.raw;
    }
    else{ // identifier
        if(display_value){
            return object.name;
        }
        else{
            return identifier(object, statements);
        }
    }
}
function identifier(object, statements){
    let var_index = check_sym_table(object.name);
    if(params.includes(object.name)){
        return object.name;
    }
    else if(statements != undefined){
        let predicate_index = check_current_sym_table(object.name, statements);
        if(predicate_index != -1){
            return statements[predicate_index].value;
        }
    }
    return identifier_in_sym_table(object, statements, var_index);

}
function identifier_in_sym_table(object, statements, var_index){
    if(var_index == -1){ // variable not in symbol table
        return object.name;
    }
    else{
        if(Array.isArray(symbolTable[var_index].value)){ // array
            return object.name;        }
        return symbolTable[var_index].value;
    }
}
function stmts(object){
    if (object['type'] == 'IfStatement'){
        ifstmt(object);
    }
    else{
        whilestmt(object);
    }
}



function whilestmt(object, statements){
    let value = '';
    let display_value = '';
    let right_element = object['test'];
    //if(right_element.type == 'BinaryExpression' || right_element.type == 'LogicalExpression'){
    value = {'left': right_expression(right_element.left), 'operator': right_element.operator, 'right': right_expression(right_element.right)};
    display_value = {'left': right_expression(right_element.left, undefined, true), 'operator': right_element.operator, 'right': right_expression(right_element.right, undefined, true)};
    //}
    //else{value = single_element(right_element);
    //    display_value = single_element(right_element, undefined, true);}
    let kind = 'while statement';
    let while_to_insert = {'line': object.loc.start.line, 'type': kind, 'value': value, 'display_value': display_value, 'statements': [], 'isTrue': false};
    if(statements == undefined){ // first while
        relevant_lines.push(while_to_insert);}
    else{ // nested while
        statements.push(while_to_insert); }
    get_predicat_statements(object.body, while_to_insert.statements);}

function ifstmt(object, statements){
    let value = '';
    let display_value = '';
    let right_element = object['test'];
    if(right_element.type == 'BinaryExpression'){
        value = {'left': right_expression(right_element.left), 'operator': right_element.operator, 'right': right_expression(right_element.right)};
        display_value = {'left': right_expression(right_element.left, undefined, true), 'operator': right_element.operator, 'right': right_expression(right_element.right, undefined, true)};
    }
    else if(right_element.type == 'LogicalExpression'){
        value = {'left': right_expression(right_element.left), 'operator': right_element.operator, 'right': right_expression(right_element.right)};
        display_value = {'left': right_expression(right_element.left, undefined, true), 'operator': right_element.operator, 'right': right_expression(right_element.right, undefined, true)};
    }
    else{value = single_element(right_element);
        display_value = single_element(right_element, undefined, true);}
    let kind = get_if_kind(object);
    if(statements == undefined){
        first_if(object, kind, value, display_value);    }
    else{
        nested_if(object, statements, kind, value, display_value);    }
}
function first_if(object, kind, value, display_value){
    let if_to_insert = {'line': object.loc.start.line, 'type': kind, 'value': value, 'display_value': display_value, 'statements': [], 'isTrue': false};
    relevant_lines.push(if_to_insert);
    get_predicat_statements(object.consequent, if_to_insert.statements);

    if(object.alternate != null && object.alternate.type == 'IfStatement'){
        ifstmt(object.alternate);
    }
    else if(object.alternate != null){
        let else_to_insert = {'line': object.alternate.loc.start.line, 'type': 'else', 'value': value, 'display_value': display_value, 'statements': [], 'isTrue': true};
        relevant_lines.push(else_to_insert);
        get_predicat_statements(object.alternate, else_to_insert.statements);
    }
}
function nested_if(object, statements, kind, value, display_value){
    let if_to_insert = {'line': object.loc.start.line, 'type': kind, 'value': value, 'display_value': display_value, 'statements': [], 'isTrue': false};
    statements.push(if_to_insert);
    get_predicat_statements(object.consequent, if_to_insert.statements);

    if(object.alternate != null && object.alternate.type == 'IfStatement'){
        ifstmt(object.alternate, statements);
    }
    else if(object.alternate != null){ // else
        let else_to_insert = {'line': object.alternate.loc.start.line, 'type': 'else', 'value': value, 'display_value': display_value, 'statements': [], 'isTrue': true};
        statements.push(else_to_insert);
        get_predicat_statements(object.alternate, else_to_insert.statements);
    }
}
function get_predicat_statements(object, statements){
    let remember_else = isElse;
    isElse = false;
    for(let i in object.body){
        if (object.body[i].type == 'ExpressionStatement'){
            expression(object.body[i], statements);
        }
        //else if(object.body[i].type == 'ReturnStatement'){
        //    returnstmt(object.body[i], statements);
        //}
        else  if(object.body[i].type == 'WhileStatement'){ //(object.body[i].type == 'IfStatement')
            whilestmt(object.body[i], statements);
        }
        else{//(object.body[i].type == 'IfStatement')
            ifstmt(object.body[i], statements);
        }
    }
    isElse = remember_else;
}
function get_if_kind(object){
    let kind = '';
    if(isElse) {
        kind = 'else if statement';
    }
    else {
        kind = 'if statement';
    }
    if(object.alternate != null) {
        if(object.alternate.type != 'IfStatement') {
            isElse = false;
        }
        else{
            isElse = true;
        }
    }
    return kind;
}

function check_sym_table(element){ // return most updated value of the element
    for(var i = 0; i < symbolTable.length; i++) {
        if (symbolTable[i].name == element) {
            return i;
        }
    }
    return -1;
}

function check_current_sym_table(element, statements){
    for(var i = 0; i < statements.length; i++) {
        if (statements[i].name == element) {
            return i;
        }
    }
    return -1;
}
