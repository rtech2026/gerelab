'use client'

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useVoices } from '@/components/voices-provider'
import { getVoiceById } from '@/lib/voices'

export function VoiceSelector({
  value,
  onChange,
}: {
  value: string
  onChange: (id: string) => void
}) {
  const { native, cloned, all } = useVoices()
  const selected = getVoiceById(value, all)

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-9 w-full justify-between">
        {selected ? (
          <span className="flex items-center gap-2">
            <span className="font-mono text-[10px] text-muted-foreground">
              {selected.flag}
            </span>
            <span className="font-medium">{selected.name}</span>
            <span className="text-xs text-muted-foreground">
              {selected.accent}
            </span>
          </span>
        ) : (
          <SelectValue placeholder="Selecione uma voz" />
        )}
      </SelectTrigger>
      <SelectContent className="max-h-80">
        {cloned.length > 0 && (
          <SelectGroup>
            <SelectLabel>Minhas vozes clonadas</SelectLabel>
            {cloned.map((v) => (
              <SelectItem key={v.id} value={v.id}>
                <span className="font-mono text-[10px] text-muted-foreground">
                  {v.flag}
                </span>
                <span className="font-medium">{v.name}</span>
                <Badge variant="secondary" className="ml-auto text-[10px]">
                  Clone
                </Badge>
              </SelectItem>
            ))}
          </SelectGroup>
        )}
        <SelectGroup>
          <SelectLabel>Vozes nativas</SelectLabel>
          {native.map((v) => (
            <SelectItem key={v.id} value={v.id}>
              <span className="font-mono text-[10px] text-muted-foreground">
                {v.flag}
              </span>
              <span className="font-medium">{v.name}</span>
              <span className="text-xs text-muted-foreground">{v.accent}</span>
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}
