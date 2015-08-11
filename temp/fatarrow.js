function A() {
  // body...

  // this.fn2 = (function(that) {
  //   console.log('@');
  //   return that.fn2;
  // })(this);
}

A.prototype.fn1 = function() {
  console.log('fn1');
};

A.prototype.fn2 = function() {
  console.log('fn2');
};

console.log("init");
var a = new A();

a.fn1 = function() {
  console.log("new fn1");
}

a.fn2 = function() {
  console.log("new fn2");
}

a.fn2();