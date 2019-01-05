import assert from 'assert';
import {parseCode} from '../src/js/code-analyzer';

describe('First test', () => {
    it('Check if conditions', () => {
        assert.equal(parseCode('function foo(x,y){\n   let a = x[0] + 1;\n   let b = y;\n' +
              '   let c = 0;\n   \n   while (a < y/2) {\n       c = a + b;\n       y = c * 2;\n' +
              '       a++;\n   }\n   \n   return x;\n' +
              '}', '[1,2,3],2'),
        'op0=>operation: <<1>>\na = x[0]+1\nb = y\nc = 0\n|true_path\nbefore_while=>operation: <<2>>\n' +
          'NULL\n|true_path\ncond0=>condition: <<3>>\na < y/2\n|true_path\nop1=>operation: <<4>>\n' +
          'c = a+b\ny = c*2\na++\nbefore_return=>end: _\n|true_path\n' +
          'e=>operation: <<5>>\n return x\n|true_path\n' +
          'op0->before_while\n' +
          'before_while->cond0\n' +
          'cond0(yes)->op1\n' +
          'cond0(no)->before_return\n' +
          'op1->before_while\n' +
          'before_return->e\n');
    });


});

describe('Second test', () => {
    it('Check else', () => {
        assert.equal(parseCode('function foo(x, y, z){\n    let a = x + 1;\n    let b = a + y;\n' +
          '    let c = 0;\n    \n    if (b < z) {\n        c = c + 5;\n    } else if (b < z * 2) {\n' +
          '        c = c + x + 5;\n    } else {\n        c = c + z + 5;\n    }\n    \n' +
          '    return c;\n}\n\n','1,2,3'),
        'op0=>operation: <<1>>\na = x+1\nb = a+y\nc = 0\n|true_path\ncond0=>condition: <<2>>\n' +
          'b < z\n|true_path\nop1=>operation: <<3>>\nc = c+5\ncond1=>condition: <<4>>\n' +
          'b < z*2\n|true_path\nop2=>operation: <<5>>\nc = c+x+5\n|true_path\nop3=>operation: <<6>>\n' +
          'c = c+z+5\nbefore_return=>end: _\n|true_path\ne=>operation: <<7>>\n return c\n' +
          '|true_path\nop0->cond0\ncond0(yes)->op1\ncond0(no)->cond1\nop1->before_return\n' +
          'cond1(yes)->op2\n' +
          'cond1(no)->op3\n' +
          'op2->before_return\n' +
          'op3->before_return\n' +
          'op3->before_return\n' +
          'before_return->e\n'
        );
    });
});

describe('Third test', () => {
    it('check while', () => {
        assert.equal(parseCode('function foo(x, y, z){\n   let a = x + 1;\n   let b = a + y;\n' +
          '   let c = 0;\n   \n   while (a < z) {\n       c = a + b;\n       z = c * 2;\n' +
          '       a++;\n   }\n   \n   return z;\n}','1,2,3'),
        'op0=>operation: <<1>>\na = x+1\nb = a+y\nc = 0\n|true_path\n' +
          'before_while=>operation: <<2>>\nNULL\n|true_path\ncond0=>condition: <<3>>\n' +
          'a < z\n|true_path\nop1=>operation: <<4>>\nc = a+b\nz = c*2\n' +
          'a++\n|true_path\nbefore_return=>end: _\n|true_path\ne=>operation: <<5>>\n' +
          ' return z\n' +
          '|true_path\n' +
          'op0->before_while\n' +
          'before_while->cond0\n' +
          'cond0(yes)->op1\n' +
          'cond0(no)->before_return\n' +
          'op1->before_while\n' +
          'before_return->e\n'
        );
    });
});

describe('Fourth test', () => {
    it('check else if condition', () => {
        assert.equal(parseCode('function foo(x, y, z){\n    let a = x + 1;\n    let b = a + y;\n' +
      '    let c = 0;\n\n    if (b >= z) {\n        c = c + 5;\n        if (b==3){\n' +
      '           x=5;\n        }\n    }\n    else if (b < z /2) {\n        c = c + x + 5;\n' +
      '    } \n    else {\n        c = c + z + 5;\n    }\n    \n    return c;\n}','1,2,3'),
        'op0=>operation: <<1>>\na = x+1\nb = a+y\nc = 0\n|true_path\ncond0=>condition: <<2>>\n' +
      'b >= z\n|true_path\nop1=>operation: <<3>>\nc = c+5\n|true_path\ncond1=>condition: <<4>>\n' +
      'b == 3\n|true_path\nop2=>operation: <<5>>\nx = 5\ncond2=>condition: <<6>>\n' +
      'b < z/2\nop3=>operation: <<7>>\nc = c+x+5\nop4=>operation: <<8>>\nc = c+z+5\n' +
      'before_return=>end: _\n|true_path\ne=>operation: <<9>>\n return c\n' +
      '|true_path\nop0->cond0\ncond0(yes)->op1\ncond0(no)->cond2\nop1->cond1\ncond1(yes)->op2\n' +
      'cond1(no)->before_return\nop2->before_return\ncond2(yes)->op3\ncond2(no)->op4\nop3->before_return\n' +
      'op4->before_return\n' +
      'op4->before_return\n' +
      'before_return->e\n'
        );
    });
});

describe('Fifth Test', () => {
    it('Check additional conditions', () => {
        assert.equal(parseCode('function foo(x, y, z){\n   let a = x + 1;\n   let b = a + y;\n' +
      '   let c = 0;\n   \n   while (a < z/2) {\n       c = a + b;\n       z =  5;\n       a = a + 1;\n' +
      'if(a<z){\na=a+10}\n   }\n\nif(b<z/2){\nb=b+10}\n   \n   return z;\n}','1,2,3'),
        'op0=>operation: <<1>>\na = x+1\nb = a+y\nc = 0\n|true_path\nbefore_while=>operation: <<2>>\n' +
      'NULL\n|true_path\ncond0=>condition: <<3>>\na < z/2\n|true_path\nop1=>operation: <<4>>\n' +
      'c = a+b\nz = 5\na = a+1\ncond1=>condition: <<5>>\na < z\nop2=>operation: <<6>>\n' +
      'a = a+10\ncond2=>condition: <<7>>\nb < z/2\n|true_path\nop3=>operation: <<8>>\n' +
      'b = b+10\nbefore_return=>end: _\n|true_path\ne=>operation: <<9>>\n return z\n' +
      '|true_path\nop0->before_while\nbefore_while->cond0\ncond0(yes)->op1\ncond0(no)->cond2\n' +
      'op1->cond1\ncond1(yes)->op2\ncond1(no)->before_while\nop2->before_while\n' +
      'cond2(yes)->op3\n' +
      'cond2(no)->before_return\n' +
      'op3->before_return\n' +
      'before_return->e\n'
        );
    });
});


describe('Sixth test', () => {
    it('Check arrays', () => {
        assert.equal(parseCode('function foo(x, y){\n   let w = [1,2];\n   w[0]=5;\n   let a = 0;\n' +
      '   if(w[0]<y){\n       a=a+10\n   }\n   else{\n       a = a + 5;\n   }\n   \n' +
      '   return a;\n}','1,2'),
        'op0=>operation: <<1>>\nw = [1,2]\nw[0] = 5\na = 0\n|true_path\ncond0=>condition: <<2>>\n' +
      'w[0] < y\n|true_path\nop1=>operation: <<3>>\na = a+10\n' +
      'op2=>operation: <<4>>\na = a+5\n|true_path\nbefore_return=>end: _\n|true_path\n' +
      'e=>operation: <<5>>\n return a\n' +
      '|true_path\n' +
      'op0->cond0\n' +
      'cond0(yes)->op1\n' +
      'cond0(no)->op2\n' +
      'op1->before_return\n' +
      'op2->before_return\n' +
      'op2->before_return\n' +
      'before_return->e\n'
        );
    });
});


describe('Seventh test', () => {
    it('Check more arrays', () => {
        assert.equal(parseCode('function foo(x, y, z){\n    let a = x + 1;\n    let b = a + y;\n' +
      '    let c = [3,4];\n    \n    if (b < z*2) {\n        c = c + 5;\n        if(b<z){\n' +
      '            a=5;\n        }\n        else if(b<z*2){\n' +
      '            x=3;\n        }\n        else{\n            x=5;\n        }\n' +
      '    } else if (b < z * 2) {\n        c[1] = c[0] + x + 5;\n    } else {\n        c[1] = c[2] + z + 5;\n    }\n' +
      '    \n    return c[0];\n}','1,2,3'),
        'op0=>operation: <<1>>\na = x+1\nb = a+y\nc = [3,4]\n|true_path\ncond0=>condition: <<2>>\nb < z*2\n' +
      '|true_path\nop1=>operation: <<3>>\nc = c+5\n|true_path\ncond1=>condition: <<4>>\nb < z\n|true_path\n' +
      'op2=>operation: <<5>>\na = 5\ncond2=>condition: <<6>>\nb < z*2\n|true_path\nop3=>operation: <<7>>\n' +
      'x = 3\n|true_path\nop4=>operation: <<8>>\nx = 5\ncond3=>condition: <<9>>\nb < z*2\nop5=>operation: <<10>>\n' +
      'c[1] = c[0]+x+5\nop6=>operation: <<11>>\nc[1] = c[2]+z+5\nbefore_return=>end: _\n|true_path\n' +
      'e=>operation: <<12>>\n return c[0]\n|true_path\nop0->cond0\ncond0(yes)->op1\ncond0(no)->cond3\n' +
      'op1->cond1\ncond1(yes)->op2\ncond1(no)->cond2\nop2->before_return\ncond2(yes)->op3\ncond2(no)->op4\n' +
      'op3->before_return\nop4->before_return\ncond3(yes)->op5\ncond3(no)->op6\nop5->before_return\n' +
      'op6->before_return\nop6->before_return\nbefore_return->e\n'
        );
    });
});

describe('Eights test', () => {
    it('check additional operators', () => {
        assert.equal(parseCode('function foo(x, y, z){\n   let a = 1 * 3;\n' +
      '   let b = 3- 2;\n   let c = 1 / 2;\n   while (a < z) {\n       c = a + b;\n' +
      '       z = c * 2;\n       a++;\n   }\n   \n   return z;\n}','1,2,3'),
        'op0=>operation: <<1>>\na = 1*3\nb = 3-2\nc = 1/2\n|true_path\n' +
      'before_while=>operation: <<2>>\nNULL\n|true_path\ncond0=>condition: <<3>>\n' +
      'a < z\n|true_path\nop1=>operation: <<4>>\nc = a+b\nz = c*2\n' +
      'a++\nbefore_return=>end: _\n|true_path\ne=>operation: <<5>>\n' +
      ' return z\n' +
      '|true_path\n' +
      'op0->before_while\n' +
      'before_while->cond0\n' +
      'cond0(yes)->op1\n' +
      'cond0(no)->before_return\n' +
      'op1->before_while\n' +
      'before_return->e\n'
        );
    });
});

describe('Ninth test', () => {
    it('check multiple conditions', () => {
        assert.equal(parseCode('function foo(x){\n   let a = false;\n   let b = true;\n' +
      '   if(a && b){\n       x = 3;\n   }\n   else if(a){\n      x = 7;\n' +
      '   }\n   return x;\n}','1'),
        'op0=>operation: <<1>>\na = false\nb = true\n|true_path\n' +
      'cond0=>condition: <<2>>\na && b\n|true_path\nop1=>operation: <<3>>\n' +
      'x = 3\ncond1=>condition: <<4>>\nfalse\n|true_path\nop2=>operation: <<5>>\n' +
      'x = 7\nbefore_return=>end: _\n|true_path\ne=>operation: <<6>>\n' +
      ' return x\n|true_path\nop0->cond0\ncond0(yes)->op1\n' +
      'cond0(no)->cond1\nop1->before_return\n' +
      'cond1(yes)->op2\n' +
      'cond1(no)->before_return\n' +
      'op2->before_return\n' +
      'before_return->e\n'
        );
    });
});



describe('Tens test', () => {
    it('check true false', () => {
        assert.equal(parseCode('function foo(x, y){\n    if(x){\n         y = 5;\n' +
      '    }\n    else if(!x){\n        y = 7;\n    }\n    return y;\n}','false, 1'),
        'cond0=>condition: <<1>>\nx\n|true_path\nop0=>operation: <<2>>\ny = 5\ncond1=>condition: <<3>>\n' +
      '!x\n|true_path\nop1=>operation: <<4>>\ny = 7\n|true_path\nbefore_return=>end: _\n' +
      '|true_path\ne=>operation: <<5>>\n return y\n|true_path\n' +
      'cond0(yes)->op0\n' +
      'cond0(no)->cond1\n' +
      'op0->before_return\n' +
      'cond1(yes)->op1\n' +
      'cond1(no)->before_return\n' +
      'op1->before_return\n' +
      'before_return->e\n'
        );
    });
});


describe('Eleventh test', () => {
    it('check multiplication condition', () => {
        assert.equal(parseCode('function foo(x, y, z){\n    let a = x + 1;\n    let b = a + y;\n' +
      '    let c = 0;\n    \n    if (b < z*3) {\n        c = c + 5;\n    } else if (b < z * 2) {\n' +
      '        c = c + x + 5;\n        if(b>z){\n            a=5;\n        }\n' +
      '        while(x<5){\n            a++;\n            x--;\n        }\n' +
      '    }\n   \n    return c;\n}','1,2,3'),
        'op0=>operation: <<1>>\na = x+1\nb = a+y\nc = 0\n|true_path\ncond0=>condition: <<2>>\n' +
      'b < z*3\n|true_path\nop1=>operation: <<3>>\nc = c+5\n|true_path\ncond1=>condition: <<4>>\n' +
      'b < z*2\nop2=>operation: <<5>>\nc = c+x+5\ncond2=>condition: <<6>>\nb > z\n' +
      '|true_path\nop3=>operation: <<7>>\na = 5\n|true_path\ncond3=>condition: <<9>>\n' +
      'x < 5\n|true_path\nop4=>operation: <<10>>\na++\nx--\n|true_path\n' +
      'before_while=>operation: <<8>>\nNULL\n|true_path\nbefore_return=>end: _\n' +
      '|true_path\ne=>operation: <<11>>\n return c\n|true_path\nop0->cond0\n' +
      'cond0(yes)->op1\ncond0(no)->cond1\nop1->before_return\ncond1(yes)->op2\n' +
      'cond1(no)->before_while\nop2->cond2\ncond2(yes)->op3\ncond2(no)->cond3\nop3->before_return\n' +
      'cond3(yes)->op4\ncond3(no)->before_return\nop4->before_while\nbefore_while->before_return\nbefore_return->e\n'
        );
    });
});


describe('Twelve test', () => {
    it('check single condition', () => {
        assert.equal(parseCode('function foo(x){\n    x++;\n    if(x){\n         x = 5;\n' +
      '    x++;\n    if(x){\n     x = 5;\n}\n' +
      '}\n\n   let a = 0;\n   a++;\n    return c;\n' +
      '}','1'),
        'op0=>operation: <<1>>\nx++\n|true_path\ncond0=>condition: <<2>>\nx\n' +
      '|true_path\nop1=>operation: <<3>>\nx = 5\nx++\n|true_path\n' +
      'cond1=>condition: <<4>>\nx\n|true_path\nop2=>operation: <<5>>\nx = 5\n' +
      '|true_path\nop3=>operation: <<6>>\na = 0\na++\n|true_path\nbefore_return=>end: _\n' +
      '|true_path\ne=>operation: <<7>>\n return c\n|true_path\n' +
      'op0->cond0\ncond0(yes)->op1\ncond0(no)->op3\nop1->cond1\ncond1(yes)->op2\n' +
      'cond1(no)->before_return\n' +
      'op2->before_return\n' +
      'op3->before_return\n' +
      'op3->before_return\n' +
      'before_return->e\n'
        );
    });
});


describe('Thirteenth test', () => {
    it('check inner while condition', () => {
        assert.equal(parseCode('function foo(x){\nwhile(x&&x){\nx=6;\n}\n    return c;\n' +
      '}','1'),
        'before_while=>operation: <<1>>\nNULL\n|true_path\ncond0=>condition: <<2>>\n' +
      'x && x\n|true_path\nop0=>operation: <<3>>\nx = 6\n' +
      '|true_path\n' +
      'before_return=>end: _\n' +
      '|true_path\n' +
      'e=>operation: <<4>>\n' +
      ' return c\n' +
      '|true_path\n' +
      'before_while->cond0\n' +
      'cond0(yes)->op0\n' +
      'cond0(no)->before_return\n' +
      'op0->before_while\n' +
      'before_return->e\n'
        );
    });
});


describe('Binary return statement', () => {
    it('', () => {
        assert.equal(parseCode('function foo(x){\n' +
      'let c = 0;\n' +
      '    return c+x;\n' +
      '}\n','1'),
        'op0=>operation: <<1>>\n' +
      'c = 0\n' +
      '|true_path\n' +
      'before_return=>end: _\n' +
      '|true_path\n' +
      'e=>operation: <<2>>\n' +
      ' return c + x\n' +
      '|true_path\n' +
      'op0->before_return\n' +
      'op0->before_return\n' +
      'before_return->e\n'
        );
    });
});
