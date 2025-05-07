# DNA可视化优化记录

## 2024-03-21 更新

### 主要更改
1. 旋转方向优化
   - 将DNA双螺旋的旋转方向从左旋改为右旋
   - 修改了所有正弦函数的相位（从 `+ time` 改为 `- time`）
   - 保持了所有能量球和骨架线的同步旋转

2. 视觉效果优化
   - 移除了双螺旋之间的连接线
   - 使先天元素（圆形）和当下元素（方形）更加突出
   - 保持了原有的发光效果和能量场

### 技术细节
- 先天元素（左螺旋）：
  - 使用实线表示骨架
  - 圆形能量球
  - 动态大小基于元素权重

- 当下元素（右螺旋）：
  - 使用虚线表示骨架
  - 方形能量球
  - 动态大小基于元素权重

### 五行颜色方案
- 木 (Wood): #00A86B (Emerald green)
- 火 (Fire): #FF4D4D (Bright red)
- 土 (Earth): #FFB344 (Earth yellow)
- 金 (Metal): #FFFFFF (White)
- 水 (Water): #4169E1 (Deep blue)

### 代码提交
- 提交信息: "feat: 优化DNA可视化效果 - 改为右旋并移除连接线"
- 修改文件:
  - src/components/EnergyDNA.tsx
  - src/constants.ts
  - src/App.tsx 