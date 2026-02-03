import { BarChart as RechartsBar, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell, type BarRectangleItem } from 'recharts'

interface BarChartData {
  name: string
  value: number
  color?: string
}

interface BarChartProps {
  data: BarChartData[]
  title?: string
  dataKey?: string
  showLegend?: boolean
  barColor?: string
  onItemClick?: (data: BarRectangleItem) => void
  selectedItem?: string | null
  interactiveMode?: boolean
}

const DEFAULT_COLORS = ['#0050C3', '#0066F5', '#52c41a', '#faad14', '#f5222d', '#722ed1', '#eb2f96', '#2F4F4F']

export function BarChart({
  data,
  title,
  dataKey = 'value',
  showLegend = false,
  barColor,
  onItemClick,
  selectedItem,
  interactiveMode = false
}: BarChartProps) {
  return (
    <div className="w-full">
      {title && (
        <h3 className="mb-4 text-lg font-semibold text-foreground">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={300}>
        <RechartsBar data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="name"
            stroke="hsl(var(--muted-foreground))"
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
          />
          <YAxis
            stroke="hsl(var(--muted-foreground))"
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '0.5rem',
            }}
            labelStyle={{
              color: 'hsl(var(--foreground))',
            }}
            itemStyle={{
              color: 'hsl(var(--foreground))',
            }}
            cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
          />
          {showLegend && <Legend />}
          <Bar
            dataKey={dataKey}
            radius={[8, 8, 0, 0]}
            onClick={onItemClick}
            style={{ cursor: interactiveMode ? 'pointer' : 'default' }}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color || barColor || DEFAULT_COLORS[index % DEFAULT_COLORS.length]}
                opacity={selectedItem && selectedItem !== entry.name ? 0.3 : 1}
              />
            ))}
          </Bar>
        </RechartsBar>
      </ResponsiveContainer>
    </div>
  )
}
