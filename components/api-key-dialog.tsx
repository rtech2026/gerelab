'use client'

import * as React from 'react'
import { KeyRound, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldLabel, FieldDescription } from '@/components/ui/field'
import { getClientKey, setClientKey } from '@/lib/client-key'

export function ApiKeyDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [value, setValue] = React.useState('')

  React.useEffect(() => {
    if (open) setValue(getClientKey())
  }, [open])

  const save = () => {
    setClientKey(value.trim())
    toast.success(
      value.trim()
        ? 'Chave LMNT salva. A síntese premium está ativa.'
        : 'Chave removida. Usando o motor neural gratuito.',
    )
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="flex size-9 items-center justify-center rounded-lg bg-muted text-brand">
            <KeyRound className="size-4" />
          </div>
          <DialogTitle>Chave da API LMNT</DialogTitle>
          <DialogDescription>
            Adicione sua chave LMNT para síntese ultrarrápida (&lt;200ms) e
            clonagem instantânea. Sem chave, o estúdio usa o motor neural
            gratuito automaticamente.
          </DialogDescription>
        </DialogHeader>

        <Field>
          <FieldLabel htmlFor="lmnt-key">API Key</FieldLabel>
          <Input
            id="lmnt-key"
            type="password"
            placeholder="lmnt_..."
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="font-mono"
          />
          <FieldDescription className="flex items-center gap-1.5">
            <ShieldCheck className="size-3.5" />
            Armazenada apenas neste navegador e enviada por requisição.
          </FieldDescription>
        </Field>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={save}>Salvar chave</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
