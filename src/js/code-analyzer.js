import * as esprima from 'esprima';
import * as escodegen from 'escodegen';

let functionArgs;
let argsToPresent;
let throwArgs;
let trueFalseLines;
let indexIfLine;

const parseCode = (codeToSubstitute,codeToArgs) => {
    functionArgs = codeToArgs.split(', ');
    argsToPresent = [];
    throwArgs = [];
    trueFalseLines = [];
    indexIfLine = [];
    let i;
    for(i = 0;i < functionArgs.length; i++){
        functionArgs[i] = (esprima.parseScript(functionArgs[i])).body[0];
    }
    let inputCode= esprima.parseScript(codeToSubstitute,{loc:true});
    let envOfProgram = [];
    let substituteCode = parseJsonCode(inputCode,envOfProgram,0);
    let outputCode = escodegen.generate(substituteCode);
    checkWhereIfLine(outputCode);
    return outputCode;
};

export {parseCode,indexIfLine,trueFalseLines};

function checkWhereIfLine(stringCode){
    let output = stringCode.split('\n');
    let i;
    for(i = 0;i < output.length;i++){
        if(output[i].indexOf('if')>=0){
            indexIfLine.push(i);
        }
    }
}

const substituteFunctions = {
    'Program' : substituteProgram,
    'FunctionDeclaration' : substituteFunctionDeclaration,
    'BlockStatement' : substituteBlockStatement,
    'VariableDeclaration' : substituteVariableDeclaration,
    'ExpressionStatement' : substituteExpressionStatement,
    'AssignmentExpression' : substituteAssignmentExpression,
    'WhileStatement' : substituteWhileStatement,
    'IfStatement' : substituteIfStatement,
    'ArrayExpression' : substituteArrayExpression,
    'BinaryExpression' : substituteBinaryExpression,
    'Identifier' : substituteIdentifier,
    'Literal' : literal,
    'MemberExpression' : substituteMemberExpression,
    'ReturnStatement' : substituteReturnStatement,
    'UnaryExpression' : substituteUnaryExpression,
    'UpdateExpression' : substituteUpdateExpression,
};

const parseJsonCode = (stringCode,environmentFunc,depth) =>{
    return substituteFunctions[stringCode.type](stringCode,environmentFunc,depth);
};

function handleEnvironment(argName,value,environmentFunc,depth){
    let i;
    for(i = 0;i < environmentFunc.length;i++){
        let element = environmentFunc[i];
        if(element['var'] === argName && element['scope'] === depth){
            element['val'] = parseJsonCode(value,environmentFunc,depth);
            return true;
        }
    }
    return false;
}

function checkExprArgs(stringCode){
    let bool = true;
    if (stringCode.type === 'ExpressionStatement') {
        bool = checkRelevantArgsToPresent(stringCode.expression);
    }
    else if(stringCode.type === 'VariableDeclaration')
        bool = checkRelevantArgsToPresent(stringCode);
    return bool;
}

function checkRelevantArgsToPresent(stringCode) {
    let bool = true;
    if ((stringCode.type === 'VariableDeclaration' && !argsToPresent.includes(escodegen.generate(stringCode.declarations[0])))) {
        bool = false;
    }
    if (stringCode.type === 'AssignmentExpression') {
        if (!argsToPresent.includes(escodegen.generate(stringCode.left))) {
            bool = false;
        }
    }
    return bool;
}

function throwExpInCurrScope(n,environmentFunc){
    let i;
    for(i=(environmentFunc.length-1);i>=0;i--){
        if(environmentFunc[i]['scope']===n){
            throwArgs.push(environmentFunc.splice(i,1));
            break;
        }
    }
}

function substituteProgram(stringCode,environmentFunc,depth){
    let i,j;
    for(i = 0;i < stringCode.body.length;i++) {
        if(stringCode.body[i].type === 'VariableDeclaration'){
            for(j = 0;j < stringCode.body[i].declarations.length;j++){
                let globalVar = escodegen.generate(stringCode.body[i].declarations[j].id);
                argsToPresent.push(globalVar);
            }
        }
        stringCode.body[i] = parseJsonCode(stringCode.body[i],environmentFunc,depth);
    }
    return stringCode;
}

function substituteFunctionDeclaration(stringCode,environmentFunc,depth){
    let i;
    for(i = 0;i < stringCode.params.length;i++){
        argsToPresent.push(escodegen.generate(stringCode.params[i]));
        environmentFunc.unshift({var:stringCode.params[i].name,val:parseJsonCode(functionArgs[i],environmentFunc,depth),scope:depth});
    }
    stringCode.body = parseJsonCode(stringCode.body,environmentFunc,depth);
    throwExpInCurrScope(0,environmentFunc);
    return stringCode;
}

function substituteBlockStatement(stringCode,environmentFunc,depth){
    let relevantOutput = [];
    let i;
    for(i = 0;i < stringCode.body.length;i++){
        stringCode.body[i] = parseJsonCode(stringCode.body[i],environmentFunc,depth+1);
        if(checkExprArgs(stringCode.body[i])){
            relevantOutput.push(stringCode.body[i]);
        }
    }
    stringCode.body = relevantOutput;
    throwExpInCurrScope(depth+1,environmentFunc);
    return stringCode;
}

function substituteVariableDeclaration(stringCode,environmentFunc,depth){
    let variable = stringCode.declarations;
    let checkUpdated;
    let i;
    for(i = 0;i < variable.length;i++){
        let varName = variable[i].id.name;
        if(variable[i].init!=null){
            checkUpdated = handleEnvironment(varName,variable[i].init,environmentFunc,depth);
            if(!checkUpdated){
                environmentFunc.unshift({var:varName,val:parseJsonCode(variable[i].init,environmentFunc,depth),scope:depth});
            }
        }
    }
    return stringCode;
}

function substituteExpressionStatement(stringCode,environmentFunc,depth){
    stringCode.expression = parseJsonCode(stringCode.expression,environmentFunc,depth);
    return stringCode;
}

function substituteAssignmentExpression(stringCode,environmentFunc,depth){
    let checkUpdated;
    stringCode.right = parseJsonCode(stringCode.right,environmentFunc,depth);
    let leftVarName = escodegen.generate(stringCode.left);
    checkUpdated = handleEnvironment(leftVarName,stringCode.right,environmentFunc,depth);
    if(!checkUpdated){
        environmentFunc.unshift({var:leftVarName,val:parseJsonCode(stringCode.right,environmentFunc,depth),scope:depth});
    }
    return stringCode;
}

function substituteArrayExpression(stringCode,environmentFunc,depth){
    let i;
    for(i = 0;i < stringCode.elements.length;i++){
        stringCode.elements[i] = parseJsonCode(stringCode.elements[i],environmentFunc,depth);
    }
    return stringCode;
}

function substituteBinaryExpression(stringCode,environmentFunc,depth){
    stringCode.left = parseJsonCode(stringCode.left,environmentFunc,depth);
    stringCode.right = parseJsonCode(stringCode.right,environmentFunc,depth);
    return evalValue(stringCode);
}


function substituteMemberExpression(stringCode,environmentFunc,depth){
    stringCode.property = parseJsonCode(stringCode.property,environmentFunc,depth);
    let property = escodegen.generate(stringCode.property);
    let objRest = '[' + property + ']';
    let objName = stringCode.object.name;
    let i;
    for(i = 0;i < environmentFunc.length;i++){
        let element = environmentFunc[i];
        if(element['var'] === objName){
            let evalArgName = eval(escodegen.generate(element['val'])+objRest);
            stringCode = esprima.parseScript(evalArgName.toString(),{loc:true});
            stringCode = stringCode.body[0].expression;
        }
    }
    return stringCode;
}

function substituteUnaryExpression(stringCode,environmentFunc,depth){
    stringCode.argument = parseJsonCode(stringCode.argument,environmentFunc,depth);
    return stringCode;
}

function substituteUpdateExpression(stringCode,environmentFunc){
    evalUpdate(stringCode,environmentFunc);
    return stringCode;
}

function evalUpdate(stringCode,environmentFunc){
    let argName = stringCode.argument.name;
    let i;
    let currIndex;
    for(i = 0;i < environmentFunc.length;i++){
        let element = environmentFunc[i];
        if(element['var'] === argName){
            currIndex = i;
        }
    }
    switch(stringCode.operator){
    case '++' :
        environmentFunc[currIndex].val.expression.value = environmentFunc[currIndex].val.expression.value + 1;
        return environmentFunc[currIndex]['val'];
    case '--' :
        environmentFunc[currIndex].val.expression.value = environmentFunc[currIndex].val.expression.value - 1;
        return environmentFunc[currIndex]['val'];
    }
}

function substituteIdentifier(stringCode,environmentFunc){
    let i;
    for(i = 0;i < environmentFunc.length;i++){
        let element = environmentFunc[i];
        if(element['var'] === stringCode.name && !argsToPresent.includes(element['var']))
            stringCode = element['val'];
    }
    return stringCode;
}

function substituteWhileStatement(stringCode,environmentFunc,depth){
    stringCode.test = parseJsonCode(stringCode.test,environmentFunc,depth);
    stringCode.body = parseJsonCode(stringCode.body,environmentFunc,depth);
    return stringCode;
}

function evalValue(stringCode){
    let currArg = escodegen.generate(stringCode);
    let i;
    for(i = 0;i < argsToPresent.length; i++){
        if(currArg.includes(argsToPresent[i]))
            return stringCode;
    }
    let evaluate = eval(currArg);
    stringCode = esprima.parseScript(evaluate.toString());
    stringCode = stringCode.body[0].expression;
    return stringCode;
}

function changeArgs(stringCode,environmentFunc){
    let currArg = escodegen.generate(stringCode);
    let i;
    for (i = 0; i < argsToPresent.length; i++) {
        if (currArg.includes(argsToPresent[i])) {
            let indexInEnv = findValueOfArgInEnv(environmentFunc,argsToPresent[i]);
            let valueOfArgInEnv = escodegen.generate(environmentFunc[indexInEnv]['val']).substring(0,1);
            currArg = changeValues(currArg, argsToPresent[i], valueOfArgInEnv);
        }
    }
    let evaluate = eval(currArg);
    return evaluate;
}

function findValueOfArgInEnv(environmentFunc,argument){
    let i;
    let out;
    for(i = 0;i < environmentFunc.length;i++){
        let element = environmentFunc[i];
        if(element['var'] === argument){
            out = i;
        }
    }
    return out;
}

function changeValues(currArg, argsToShow,newValue){
    let argArray = currArg.split(' ');
    let i;
    for(i = 0;i < argArray.length;i++){
        if(argArray[i].charAt(0) === '('){
            argArray[i] = argArray[i].substring(1);
        }
        else if(argArray[i].charAt(1) === ')'){
            argArray[i] = argArray[i].substring(0,1);
        }
        if(argArray[i] === argsToShow){
            argArray[i] = newValue;
        }
    }
    return argArray.join(' ');
}

function substituteIfStatement(stringCode,environmentFunc,depth){
    stringCode.test = parseJsonCode(stringCode.test,environmentFunc,depth);
    let resultTest = changeArgs(stringCode.test,environmentFunc,depth);
    if(resultTest)
        trueFalseLines.push(true);
    else
        trueFalseLines.push(false);
    depth = depth+1;
    let temp = Object.assign([],environmentFunc);
    stringCode.consequent = parseJsonCode(stringCode.consequent,environmentFunc,depth);
    throwExpInCurrScope(depth,environmentFunc);
    environmentFunc = Object.assign([],temp);
    if(stringCode.alternate === null){
        return stringCode;
    }
    stringCode.alternate = parseJsonCode(stringCode.alternate,environmentFunc,depth);
    throwExpInCurrScope(depth,environmentFunc);
    environmentFunc = Object.assign([],temp);
    return stringCode;
}

function literal(stringCode){
    return stringCode;
}

function substituteReturnStatement(stringCode,environmentFunc,depth){
    stringCode.argument = parseJsonCode(stringCode.argument,environmentFunc,depth);
    return stringCode;
}