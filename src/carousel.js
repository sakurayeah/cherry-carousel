import $ from 'anima-yocto-lite';

export default class Carousel {
  constructor(opts = {}) {
    const {
      element = '', // 容器 class 名，注意这一层不要加 pandding
      panelWrapCls = '', // 轮播列表父元素 class 名
      panelCls = '', // 轮播列表 class 名
      dotCls = '', // 显示面板指示点 class 名
      activeCls = '', // 当前激活的指示点  class 名
      duration = 300, // 切换动画速度
      callback = function () { }, // 回调函数
      interval = null, // 轮播时间，填了就会自动轮播，单位ms
      validDistance = 20, // 拖拽触发翻页的距离
      current = 0, // 默认起始页
    } = opts;

    // 轮播容器
    this.element = $(`.${element}`);
    // 轮播列表的外层
    this.panelWrap = $(`.${panelWrapCls}`);
    // 轮播列表
    const panels = $(`.${panelCls}`);
    // 指示点
    this.dots = $(`.${dotCls}`);
    // 指示点激活状态样式
    this.activeCls = activeCls;
    this.duration = duration;
    this.callback = callback;
    this.validDistance = validDistance;
    this.current = current < panels.length ? current : 0;

    // 当 panel 个数大于 1 时，才进行轮播
    if (panels.length > 1) {
      this.panels = panels;

      // 当 panel 只有两个时，要进行复制补充
      if (panels.length === 2) {
        this.copy = true;
        this.panelWrap.append($(panels[0]).clone());
        this.panelWrap.append($(panels[1]).clone());
        this.panels = $(`.${panelCls}`);
      }

      // panel 个数
      this.length = this.panels.length;
      // 创建 panel 的 index 数组
      this.panelIndex = buildPanelIndex(this.length, this.current);

      this.init();
      this.bindEvent();

      // 自动播放
      if (interval && interval > duration) {
        this.interval = interval;
        this.begin();
      }
    }
  }

  init() {
    // 获取步长
    this.step = getStep(this.panels);
    // 默认的 panel 位置（隐藏除了 中、右、左 以外其他的 panel 在这个位置）
    this.hideTransform = `translate(${this.step}px, 0px) translateZ(0px)`;
    // 设置 panel-wrap 的宽度，等于 步长 * panel个数
    this.panelWrap.css({
      width: `${this.step * this.length}px`
    })

    // 放在 中、右、左 的 transform
    const transform = this.getTransform(0);
    // 当前 panel 的 index 顺序
    const panelIndex = [...this.panelIndex];
    const map = [];
    for (let i = 0; i < 3; i++) {
      // 从左边取 panelIndex 里的内容
      if (i < 2) {
        map[panelIndex.shift()] = transform[i];
        // 从右边取 panelIndex 里的内容
      } else {
        map[panelIndex.pop()] = transform[i];
      }
    }

    this.panels.forEach((v, i) => {
      // 先把所有的 panel 在panel-wrap内重叠起来
      $(v).css({
        'width': `${this.step}px`,
        'left': `${-this.step * i}px`,
      })
      // 设置 panel 的位置，设定 中、右、左三个位置的内容，其余多的都放在右的位置
      setTransform($(v), map[i] || this.hideTransform, 0)
    })
  }

  // 事件绑定
  bindEvent() {
    this.panelWrap.on('touchstart', (e) => this.handleTouchStart(e));
    this.panelWrap.on('touchmove', (e) => this.handleTouchMove(e));
    this.panelWrap.on('touchend', (e) => this.handleTouchEnd(e));
    this.panelWrap.on('transitionend', (e) => this.handleTransitionEnd(e));

    // 首次进入
    this.callback(this.current);
    this.updateDots(this.current)
  }

  // 拖拽开始
  handleTouchStart(e) {
    this.stop();
    const et = e.touches[0];
    // 记录开始坐标
    this.coord = {
      x: et.pageX,
      y: et.pageY,
      time: Date.now()
    }
  }

  handleTouchMove(e) {
    if (e.touches.length > 1 || e.scale && e.scale !== 1) return;

    const et = e.touches[0];
    const coord = this.coord;

    // 计算移动距离
    const distance = this.distance = {
      x: et.pageX - coord.x,
      y: et.pageY - coord.y
    }

    // 判断是否在拖拽，防止出现先水平后垂直走位
    this.isMoving = this.isMoving || Math.abs(distance.x) > Math.abs(distance.y);

    if (this.isMoving) {
      e.preventDefault();
      this.handleMove(distance.x);
    }

  }

  handleTransitionEnd() {
    if (this.playTimer === null) {
      this.begin();
    }
  }

  handleTouchEnd() {
    // 没有触发滑动
    if (!this.isMoving) {
      this.playTimer === null && this.begin();
      return;
    }

    const interval = Date.now() - this.coord.time;
    // 移动距离
    const distanceX = Math.abs(this.distance.x);
    // 拖拽方向
    const direction = this.distance.x > 0 ? 'right' : 'left';

    // 当拖拽距离 大于或等于 有效翻页距离 时，允许翻页
    if (distanceX >= this.validDistance) {
      this.move(direction);
    } else {
      this.handleMove('left')
    }

    // 重置
    this.distance = null;
    this.isMoving = false;
  }

  begin() {
    // 自动播放时，左滑
    this.playTimer = setInterval(() => this.move('left'), this.interval)
  }

  move(direction) {
    // 移动完成后，要调换 panelIndex 数组里的顺序
    const array = this.panelIndex;
    // 向左拖拽时，将数组的第一个放在数组的最后一位
    if (direction === 'left') {
      array.push(array.shift())
      // 像右拖拽时，将数组的最后一位放在数组的第一位
    } else {
      array.unshift(array.pop())
    }
    // 放置到对应位置
    this.handleMove(direction);
    // 触发回调
    this.callback(this.getCurrent())
    // 改变触发器
    this.updateDots(this.getCurrent())
  }

  stop() {
    if (this.playTimer) {
      clearInterval(this.playTimer);
      this.playTimer = null;
    }
  }

  handleMove(distance) {
    // 位移
    const _delta = typeof distance === 'string' ? 0 : distance;
    // 方向
    const direction = typeof distance === 'string' ? distance : (distance > 0 ? 'right' : 'left');

    // 当前 panel 的 index 顺序
    const panelIndex = [...this.panelIndex];

    // 移动时，中、右、左 的 transform
    const transform = this.getTransform(_delta);

    // 获取当前 中、右、左 的index
    const change = [];
    for (let i = 0; i < 3; i++) {
      // 从左边取 panelIndex 里的内容
      if (i < 2) {
        change[i] = panelIndex.shift();
        // 从右边取 panelIndex 里的内容
      } else {
        change[i] = panelIndex.pop();
      }
    }

    // 判断不需要 duration 的
    const noDurationIndex = direction === 'left' ? change[1] : change[2]

    change.forEach((value, index) => {
      // 判断 只有当前和下一个将出现的 panel 才需要 duration , 其他都设置为 0
      const duration = (value === noDurationIndex || _delta !== 0) ? 0 : this.duration;
      // 设置 中、右、左 的 transform 来进行移动
      setTransform($(this.panels[value]), transform[index], duration);
    })

    /* 元素个数大于3 并且非手动情况下，处理第四个元素的隐藏 */
    // 移动完成后，将不应该在 中、左、右 位置上的元素，放置右的位置
    if (panelIndex.length && _delta === 0) {
      const hideIndex = direction === 'left' ? panelIndex.pop() : panelIndex.shift();
      setTransform($(this.panels[hideIndex]), this.hideTransform, 0)
    }
  }

  getTransform(distance) {
    return [
      `translate(${distance}px, 0px) translateZ(0px)`,
      `translate(${this.step + distance}px, 0px) translateZ(0px)`,
      `translate(${-this.step + distance}px, 0px) translateZ(0px)`,
    ]
  }

  // 获取当前的 index
  getCurrent() {
    const index = this.panelIndex[0];
    // 当只有两个 panel 的时候，取余数
    return this.copy ? index % 2 : index;
  }

  // 更新知识点
  updateDots(index) {
    const activeCls = this.activeCls;
    this.dots.removeClass(activeCls);
    this.dots.eq(index).addClass(activeCls);
  }
}

// 创建数组
function buildPanelIndex(length, current) {
  const res = [];
  for (let i = 0; i < length; i++) {
    res.push(i)
  }

  let arr = [];
  if (current) {
    arr = res.splice(0, current);
  }

  return [...res, ...arr];
}

// 获取步长：一个 panel 的长度
function getStep(panel) {
  return panel.width();
}

// 设置样式
function setTransform(dom, transform, duration) {
  dom.css({
    transform: transform,
    transitionDuration: `${duration}ms`
  })
}