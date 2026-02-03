import { Label } from '@/components/ui/label'
import { CAROUSEL_CONSTRAINTS } from '../../types/appearance'

interface CarouselIntervalSliderProps {
  value: number
  onChange: (value: number) => void
}

export function CarouselIntervalSlider({ value, onChange }: CarouselIntervalSliderProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(Number(e.target.value))
  }

  const seconds = value / 1000

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <div className="flex items-center justify-between">
        <Label htmlFor="interval-slider">Intervalo de Rotação</Label>
        <span className="text-sm font-medium">{seconds}s</span>
      </div>
      <input
        id="interval-slider"
        type="range"
        min={CAROUSEL_CONSTRAINTS.MIN_INTERVAL}
        max={CAROUSEL_CONSTRAINTS.MAX_INTERVAL}
        step={1000}
        value={value}
        onChange={handleChange}
        className="w-full"
      />
      <p className="text-xs text-muted-foreground">
        Define a cada quantos segundos as imagens do carrossel mudam
      </p>
    </div>
  )
}
