## To run this example
1. git clone https://github.com/sakurayeah/cherry-carousel.git
2. cd cherry-carousel
3. npm install
4. npm run doc
5. open http://localhost:8989/examples/base.html in the browser

## How to use

### install
```
$ npm i cherry-carousel
```

### usage
```html
<div class="component-carousel">
  <ul class="item-wrap">
    <li class="item"><div class="list">000</div></li>
    <li class="item"><div class="list">111</div></li>
    <li class="item"><div class="list">222</div></li>
    <li class="item"><div class="list">333</div></li>
    <li class="item"><div class="list">444</div></li>
  </ul>
  <ul class="trigger-wrap">
    <li class="trigger active"></li>
    <li class="trigger"></li>
    <li class="trigger"></li>
    <li class="trigger"></li>
    <li class="trigger"></li>
  </ul>
</div>
```

```css
body, h1, h2, h3, h4, h5, h6, hr, p, blockquote, dl, dt, dd, ul, ol, li, pre, fieldset, button, input, textarea, th, td {
  margin: 0;
  padding: 0;
}
li {
  list-style: none;
}
.main {
  height: 100px;
  background: #bbb;
}

.component-carousel {
  position: relative;
  overflow: hidden;
  height: 5.85rem;
  background-color: #e7e7e7;
}
.item-wrap {
  position: relative;
  overflow: hidden;
}
.item {
  position: relative;
  float: left;
  width: 100%;
}
.list {
  width: 100%;
  height: 5.85rem;
  background: #ddd;
}
.trigger-wrap {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 10px;
}
.trigger{
  float: left;
  height: 10px;
  width: 10px;
  background: #fff;
  border-radius: 100%;
  margin-right: 10px;
}
.active {
  background: lightseagreen;
}
```

```js
import { Carousel } from 'cherry-carousel';
new Carousel({
  element: 'component-carousel',
  panelWrapCls: 'item-wrap',
  panelCls: 'item',
  speed: 300,
  activeCls: 'active',
  dotCls: 'trigger',
  interval: 3000,
  callback: function (currentIndex) {
    console.log(currentIndex)
  }
})
```