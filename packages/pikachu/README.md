# Pikachu 绘制：纯 CSS vs Canvas

下面用两种方式“绘制皮卡丘脸部”，并把每种方式的关键知识点整理成可复用的清单。

---

## 方法一：纯 CSS 绘制

**适用场景**

- 组件化装饰图形、图标、加载动画
- 不需要位图资源，想要可缩放、可换肤（变量）和可响应式

**关键知识点（整理）**

- **布局定位**：相对定位容器 + 子元素绝对定位；用 `inset/left/top` 精确摆放。
- **基本形状**：`border-radius` 画圆/椭圆；用 `transform: rotate()` 旋转鼻子/嘴角。
- **细节高光**：伪元素 `::before/::after` 叠加白色高光点，或用 `box-shadow` 批量复制小亮点。
- **层级管理**：`z-index` 明确“脸底色 → 五官 → 嘴 → 舌头”的叠放顺序。
- **可维护性**：用 CSS 变量统一尺寸与颜色，做到“一处改动，全局生效”。

### 示例（可直接复制到任意 HTML）

```html
<div class="pika" role="img" aria-label="pikachu face">
  <div class="eye eye--left"></div>
  <div class="eye eye--right"></div>
  <div class="cheek cheek--left"></div>
  <div class="cheek cheek--right"></div>
  <div class="nose"></div>
  <div class="mouth">
    <div class="tongue"></div>
  </div>
</div>

<style>
  .pika {
    --yellow: #f7d400;
    --red: #f51217;
    --black: #111;
    --white: #fff;

    --w: 520px;
    --h: 280px;
    --stroke: 3px;

    position: relative;
    width: var(--w);
    height: var(--h);
    background: var(--yellow);
    overflow: hidden;
  }

  .eye {
    position: absolute;
    width: 96px;
    height: 96px;
    background: #2f2f2f;
    border: var(--stroke) solid var(--black);
    border-radius: 50%;
    top: 46px;
  }

  .eye::after {
    content: "";
    position: absolute;
    width: 34px;
    height: 34px;
    background: var(--white);
    border-radius: 50%;
    top: 10px;
    left: 16px;
  }

  .eye--left {
    left: 140px;
  }

  .eye--right {
    right: 140px;
  }

  .cheek {
    position: absolute;
    width: 108px;
    height: 108px;
    background: var(--red);
    border: var(--stroke) solid var(--black);
    border-radius: 50%;
    top: 138px;
  }

  .cheek--left {
    left: 68px;
  }

  .cheek--right {
    right: 68px;
  }

  .nose {
    position: absolute;
    width: 16px;
    height: 12px;
    background: var(--black);
    border-radius: 0 0 12px 12px;
    top: 118px;
    left: 50%;
    transform: translateX(-50%) rotate(45deg);
  }

  .mouth {
    position: absolute;
    width: 360px;
    height: 180px;
    left: 50%;
    top: 96px;
    transform: translateX(-50%);
  }

  .mouth::before,
  .mouth::after {
    content: "";
    position: absolute;
    width: 130px;
    height: 72px;
    border: var(--stroke) solid var(--black);
    border-color: transparent transparent var(--black) transparent;
    border-radius: 0 0 120px 120px;
    top: 10px;
  }

  .mouth::before {
    left: 42px;
    transform: rotate(-10deg);
  }

  .mouth::after {
    right: 42px;
    transform: rotate(10deg);
  }

  .mouth .tongue {
    position: absolute;
    width: 150px;
    height: 150px;
    background: #ff4b6b;
    border: var(--stroke) solid var(--black);
    border-radius: 0 0 120px 120px;
    left: 50%;
    bottom: 6px;
    transform: translateX(-50%);
  }
</style>
```

---

## 方法二：使用 Canvas 绘制

**适用场景**

- 图形数量多、动画频繁（每帧重绘更直接）
- 需要后续导出图片（`toDataURL`）或做粒子/路径动画

**关键知识点（整理）**

- **坐标系与缩放**：用 `devicePixelRatio` 适配高清屏；`scale(dpr, dpr)` 保持视觉尺寸不变。
- **路径建模**：`beginPath/moveTo/arc/quadraticCurveTo/bezierCurveTo` 组合五官轮廓。
- **描边与填充**：统一用 `lineWidth/lineJoin/lineCap` 控制风格；分层“先填充再描边”更稳定。
- **图层顺序**：按“底色→眼睛→脸颊→鼻子→嘴→舌头/高光”绘制，避免遮挡错误。
- **可复用**：把每个器官封装成函数（`drawEye/drawCheek/drawMouth`），传入中心点和缩放比例。

### 示例（原生 JS）

```html
<canvas id="pikaCanvas" style="width: 520px; height: 280px;"></canvas>

<script>
  const canvas = document.getElementById("pikaCanvas");
  const dpr = window.devicePixelRatio || 1;
  const width = 520;
  const height = 280;

  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);

  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);

  const colors = {
    yellow: "#f7d400",
    red: "#f51217",
    black: "#111",
    eye: "#2f2f2f",
    tongue: "#ff4b6b",
    white: "#fff",
  };

  function fillStroke(fill, stroke, lineWidth = 3) {
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill();
    }
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = lineWidth;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.stroke();
    }
  }

  function drawBackground() {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = colors.yellow;
    ctx.fillRect(0, 0, width, height);
  }

  function drawEye(cx, cy) {
    ctx.beginPath();
    ctx.arc(cx, cy, 48, 0, Math.PI * 2);
    fillStroke(colors.eye, colors.black);

    ctx.beginPath();
    ctx.arc(cx - 10, cy - 20, 16, 0, Math.PI * 2);
    fillStroke(colors.white, null);
  }

  function drawCheek(cx, cy) {
    ctx.beginPath();
    ctx.arc(cx, cy, 54, 0, Math.PI * 2);
    fillStroke(colors.red, colors.black);
  }

  function drawNose(cx, cy) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(Math.PI / 4);
    ctx.beginPath();
    ctx.roundRect(-8, -6, 16, 12, 10);
    fillStroke(colors.black, null);
    ctx.restore();
  }

  function drawMouth(cx, cy) {
    ctx.beginPath();
    ctx.lineWidth = 3;
    ctx.strokeStyle = colors.black;
    ctx.lineCap = "round";

    ctx.beginPath();
    ctx.moveTo(cx - 70, cy);
    ctx.quadraticCurveTo(cx - 10, cy + 36, cx, cy + 26);
    ctx.quadraticCurveTo(cx + 10, cy + 36, cx + 70, cy);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx - 120, cy - 10);
    ctx.quadraticCurveTo(cx - 90, cy + 44, cx - 20, cy + 30);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx + 120, cy - 10);
    ctx.quadraticCurveTo(cx + 90, cy + 44, cx + 20, cy + 30);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx - 40, cy + 40);
    ctx.quadraticCurveTo(cx, cy + 120, cx + 40, cy + 40);
    ctx.closePath();
    fillStroke(colors.tongue, colors.black);
  }

  drawBackground();
  drawEye(190, 92);
  drawEye(330, 92);
  drawCheek(122, 192);
  drawCheek(398, 192);
  drawNose(260, 124);
  drawMouth(260, 150);
</script>
```
