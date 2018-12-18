import assert from 'assert';
import {parseCode} from '../src/js/code-analyzer';

describe('symbolic-substitution test:', () => {
    it('Test 1:', () => {
        assert.equal(parseCode(
            'function foo(x,y){\n' +
            'let a = x;\n' +
            'let b = 0;\n' +
            'if(y<5){\n' +
            'x = x + 1;\n' +
            '}\n' +
            'return x;\n' +
            '}',
            '1, 2, '),
        'function foo(x, y) {\n' +
            '    if (y < 5) {\n' +
            '        x = x + 1;\n' +
            '    }\n' +
            '    return x;\n' +
            '}');
    });
});

describe('symbolic-substitution test:', () => {
    it('Test 2:', () => {
        assert.equal(parseCode(
            'function doo(x,y,z){\n' +
            'let a = y + 1;\n' +
            'let b = z + 2;\n' +
            'x = 10;\n' +
            'let c = x + a;\n' +
            'return c;\n' +
            '}',
            '1, 2, 3, '),
        'function doo(x, y, z) {\n' +
            '    x = 10;\n' +
            '    return x + (y + 1);\n' +
            '}');
    });
});

describe('symbolic-substitution test:', () => {
    it('Test 3:', () => {
        assert.equal(parseCode(
            'function boo(){\n' +
            'let a = 12;\n' +
            'let b = 1;\n' +
            'return a + b;\n' +
            '}',
            ''),
        'function boo() {\n' +
            '    return 13;\n' +
            '}');
    });
});

describe('symbolic-substitution test:', () => {
    it('Test 4:', () => {
        assert.equal(parseCode(
            'function boo(x,y){\n' +
            'let a = x + 2;\n' +
            'let b = 1;\n' +
            'while(x<10){\n' +
            'y = b + 1;\n' +
            '}\n' +
            'return y;\n' +
            '}',
            '1, 2, '),
        'function boo(x, y) {\n' +
            '    while (x < 10) {\n' +
            '        y = 2;\n' +
            '    }\n' +
            '    return y;\n' +
            '}');
    });
});

describe('symbolic-substitution test:', () => {
    it('Test 5:', () => {
        assert.equal(parseCode(
            'function foo(x, y){\n' +'    let a = x + 2;\n' +'    let b = a + y;\n' +
            '\n' + '    if (a < 10) {\n' + '        b = y + 2;\n' + '        return x + y +b;\n' +
            '    }\n' +
            '    else{\n' +
            'return x;}\n' +
            '}',
            '2, 4, '),
        'function foo(x, y) {\n' +
            '    if (x + 2 < 10) {\n' +
            '        return x + y + (y + 2);\n' +
            '    } else {\n' +
            '        return x;\n' +
            '    }\n' +
            '}');
    });
});

describe('symbolic-substitution test:', () => {
    it('Test 6:', () => {
        assert.equal(parseCode(
            'function foo(x, y, z){\n' +'    let a = x + y;\n' +'    let b = y;\n' +'\n' +'    if (a < z) {\n' +
            '        b = y + 2;\n' +'        return x + y +b;\n' +'    }\n' +'    else if(b < 3){\n' +'        return a + y + z;\n' +
            '}\n' +'else{\n' +'return false;}\n' +'}','1, 3, 5, '),
        'function foo(x, y, z) {\n' +
            '    if (x + y < z) {\n' +
            '        return x + y + (y + 2);\n' +
            '    } else if (y < 3) {\n' +
            '        return x + y + y + z;\n' +
            '    } else {\n' +
            '        return false;\n' +
            '    }\n' +
            '}');
    });
});

describe('symbolic-substitution test:', () => {
    it('Test 7:', () => {
        assert.equal(parseCode(
            'function foo(x, y, z){\n' +'    let a = 5;\n' +'    let b = a + x;\n' +'\n' + '    while (a + b < z) {\n' +
            '        x++;\n' + '        b = x + y;\n' + '        return b;\n' + '    }\n' +
            '}','2, 4, 6, '),
        'function foo(x, y, z) {\n' +
            '    while (5 + (5 + x) < z) {\n' +
            '        x++;\n' +
            '        return x + y;\n' +
            '    }\n' +
            '}');
    });
});

describe('symbolic-substitution test:', () => {
    it('Test 8:', () => {
        assert.equal(parseCode(
            'let c = 2;\n' +
            'function foo(x, y){\n' + '    let a = c + 1;\n' + '    let b = y + 2;\n' + '\n' +
            '    if (a + 2 < 5) {\n' + '        a = x + 2;\n' + '        return a;\n' + '    }\n' +
            '    else if(b < 10){\n' + '        b = b + 1;\n' + '        return b;\n' + '    }\n' +
            '}','1, 2,  '),
        'let c = 2;\n' + 'function foo(x, y) {\n' + '    if (c + 1 + 2 < 5) {\n' + '        return x + 2;\n' +
            '    } else if (y + 2 < 10) {\n' + '        return y + 2 + 1;\n' + '    }\n' + '}');
    });
});

describe('symbolic-substitution test:', () => {
    it('Test 9:', () => {
        assert.equal(parseCode(
            'let d = [1,2,3];\n' + 'function foo(x, y, z){\n' + '    let a = x + y;\n' + '    let b = d[0];\n' + '\n' +
            '    if (a + b < 20) {\n' + '        a = 1;\n' + '        return a;\n' + '    }\n' + '    else{\n' +
            '        b = b + 1;\n' + '        return b;\n' + '    }\n' +
            '}','1, 2, 3, '),
        'let d = [\n' + '    1,\n' + '    2,\n' + '    3\n' +
            '];\n' +
            'function foo(x, y, z) {\n' +
            '    if (x + y + 1 < 20) {\n' +
            '        return 1;\n' +
            '    } else {\n' +
            '        return 2;\n' +
            '    }\n' +
            '}');
    });
});

describe('symbolic-substitution test:', () => {
    it('Test 10:', () => {
        assert.equal(parseCode(
            'function goo(x){\n' + '    let M =[2,4,6];\n' + '    let a = x;\n' +
            '    if(M[2]==6){\n' + '       return a;\n' + '    }\n' +
            '}','1,  '),
        'function goo(x) {\n' +
            '    if (true) {\n' +
            '        return x;\n' +
            '    }\n' +
            '}');
    });
});

describe('symbolic-substitution test:', () => {
    it('Test 11:', () => {
        assert.equal(parseCode(
            'function goo(x){\n' + '    let a = 2;\n' + 'while(a<7){\n' +
            'return -x;\n' + '}\n' + '}','1,  '),
        'function goo(x) {\n' +
            '    while (true) {\n' +
            '        return -x;\n' +
            '    }\n' +
            '}');
    });
});

describe('symbolic-substitution test:', () => {
    it('Test 12:', () => {
        assert.equal(parseCode(
            'function goo(x){\n' +
            '   let a = x + 1;\n' +
            '   if(a<10){\n' +
            '      x--;\n' +
            '      return a;\n' +
            '   }\n' +
            '}','1,  '),
        'function goo(x) {\n' +
            '    if (x + 1 < 10) {\n' +
            '        x--;\n' +
            '        return x + 1;\n' +
            '    }\n' +
            '}');
    });
});

describe('symbolic-substitution test:', () => {
    it('Test 13:', () => {
        assert.equal(parseCode(
            'let d = [1,2]\n' + 'function goo(x,y,z){\n' + '   let a = d[1];\n' +
            '   let b = x + y;\n' + '   if(a + b < 10){\n' + '      z = x * 2;\n' + '      return z;\n' +
            '   }\n' + '}','1, 2, 3, '),
        'let d = [\n' + '    1,\n' + '    2\n' + '];\n' +
            'function goo(x, y, z) {\n' + '    if (2 + (x + y) < 10) {\n' + '        z = x * 2;\n' +
            '        return z;\n' + '    }\n' + '}');
    });
});

describe('symbolic-substitution test:', () => {
    it('Test 14:', () => {
        assert.equal(parseCode(
            'function foo(x){\n' +
            '    let a = 2;\n' +
            '    let b;\n' +
            '    a = x + 1;    \n' +
            '    return x;\n' +
            '}\n','1, '),
        'function foo(x) {\n' +
            '    return x;\n' +
            '}');
    });
});

describe('symbolic-substitution test:', () => {
    it('Test 15:', () => {
        assert.equal(parseCode(
            'let d = 2;\n' +
            'function goo(x,y,z){   \n' + 'let a = d;\n' + 'let d = 1;\n' + 'let c = 0;\n' +
            'let a = 3;\n' + 'if(a + d < 10){\n' + 'z = x * 2;\n' + 'return z;\n' + '}\n' +
            '}','1, 2, 3, '),
        'let d = 2;\n' +
            'function goo(x, y, z) {\n' + '    if (3 + d < 10) {\n' + '        z = x * 2;\n' + '        return z;\n' +
            '    }\n' + '}');
    });
});









