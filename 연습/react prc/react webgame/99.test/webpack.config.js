const path = require('path');
// node,  path 모듈

module.exports = {
    entry:{
        app: path.join(__dirname, './main.js')
    },
    module:{

    },
    plugins : [

    ],
    output : {
        filename: '[name].js',
        path: path.join(__dirname, './dist')
        // 그냥 path하면 절대경로를 찾을수 없다는 에러가 뜨게되는데 node path모듈을 사용해서 복잡하지 않게 에러 해결 가능 !
    },
}