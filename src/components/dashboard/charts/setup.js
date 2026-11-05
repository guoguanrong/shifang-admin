// 按需注册 ECharts：只引入看板用到的折线图、饼图与必要组件，减小打包体积。
import { use } from 'echarts/core'
import { LineChart, PieChart } from 'echarts/charts'
import { GraphicComponent, GridComponent, LegendComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

use([
  LineChart,
  PieChart,
  GridComponent,
  GraphicComponent,
  LegendComponent,
  TooltipComponent,
  CanvasRenderer,
])
