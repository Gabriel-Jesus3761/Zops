import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, Legend, Tooltip, type PieLabelRenderProps } from 'recharts'

interface PieChartData {
  name: string
  value: number
  color?: string
  [key: string]: any
}

interface PieChartProps {
  data: PieChartData[]
  title?: string
  showLegend?: boolean
  innerRadius?: number
  outerRadius?: number
  onItemClick?: (data: PieChartData) => void
  selectedItem?: string | null
  interactiveMode?: boolean
  compact?: boolean
}

const DEFAULT_COLORS = ['#0050C3', '#0066F5', '#52c41a', '#faad14', '#f5222d', '#722ed1', '#eb2f96', '#2F4F4F']

export function PieChart({
  data,
  title,
  showLegend = true,
  innerRadius = 60,
  outerRadius = 100,
  onItemClick,
  selectedItem,
  interactiveMode = false,
  compact = false
}: PieChartProps) {
  // Calculate total for percentage
  const total = data.reduce((sum, item) => sum + item.value, 0)

  // Custom label to show percentage
  const renderLabel = (props: PieLabelRenderProps) => {
    const entry = data.find(item => item.name === props.name)
    if (!entry) return ''
    const percent = ((entry.value / total) * 100).toFixed(1)
    return `${percent}%`
  }

  // Compact mode: smaller chart with legend on the right
  if (compact) {
    return (
      <div className="w-full">
        {title && (
          <h3 className="mb-2 text-sm font-semibold text-foreground">{title}</h3>
        )}
        <div className="flex items-center gap-3">
          {/* Mini Pie Chart */}
          <ResponsiveContainer width={100} height={100}>
            <RechartsPie>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={25}
                outerRadius={45}
                paddingAngle={2}
                dataKey="value"
                labelLine={false}
                onClick={onItemClick}
                style={{ cursor: interactiveMode ? 'pointer' : 'default' }}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length]}
                    opacity={selectedItem && selectedItem !== entry.name ? 0.3 : 1}
                  />
                ))}
              </Pie>
            </RechartsPie>
          </ResponsiveContainer>

          {/* Compact Legend */}
          <div className="flex-1 space-y-1">
            {data.map((entry, index) => {
              const percent = ((entry.value / total) * 100).toFixed(1)
              return (
                <div key={`legend-${index}`} className="flex items-center gap-2 text-xs">
                  <div
                    className="h-2 w-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: entry.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length] }}
                  />
                  <span className="truncate flex-1">{entry.name}</span>
                  <span className="font-semibold flex-shrink-0">{entry.value} ({percent}%)</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  // Normal mode
  return (
    <div className="w-full">
      {title && (
        <h3 className="mb-4 text-lg font-semibold text-foreground">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={300}>
        <RechartsPie>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            paddingAngle={2}
            dataKey="value"
            label={renderLabel}
            labelLine={false}
            onClick={onItemClick}
            style={{ cursor: interactiveMode ? 'pointer' : 'default' }}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length]}
                opacity={selectedItem && selectedItem !== entry.name ? 0.3 : 1}
              />
            ))}
          </Pie>
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
          />
          {showLegend && (
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value, entry: any) => {
                const percent = ((entry.payload.value / total) * 100).toFixed(1)
                return `${value} (${entry.payload.value} - ${percent}%)`
              }}
            />
          )}
        </RechartsPie>
      </ResponsiveContainer>
    </div>
  )
}
