import $ from 'jquery';
import {parseCode,indexIfLine,trueFalseLines} from './code-analyzer';

$(document).ready(function () {
    $('#codeSubmissionButton').click(() => {
        let codeToParse = $('#codePlaceholder').val();
        let codeToArgs = $('#argsPlaceholder').val();
        let parsedCode = parseCode(codeToParse,codeToArgs);
        $('#parsedCode').html(paintedCode(parsedCode,indexIfLine,trueFalseLines));
    });
});

function paintedCode(outputCode,lineIfNum,colorCode){
    let codeLines = outputCode.split('\n');
    let presentCode = '';
    let paintIndex = 0,i;
    for(i = 0;i<codeLines.length;i++){
        if(lineIfNum.indexOf(i)>=0){
            if(colorCode[paintIndex]){
                presentCode += '<p>' + '<markGreen>' + codeLines[i] + '</markGreen>' + '</p>';
            }
            if(!colorCode[paintIndex]){
                presentCode += '<p>' + '<markRed>' + codeLines[i] + '</markRed>' + '</p>';
            }
            paintIndex++;
        }
        else{
            presentCode+=codeLines[i]+'</br\n>';
        }
    }
    return presentCode;
}
