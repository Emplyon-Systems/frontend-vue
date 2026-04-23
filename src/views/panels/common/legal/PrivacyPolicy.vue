<script setup lang="ts">
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import UIComponentCard from "@/components/UIComponentCard.vue";
</script>

<template>
  <DefaultLayout>
    <div class="py-4">
      <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
        <div>
          <h1 class="h4 mb-1">Compliance</h1>
          <p class="text-muted mb-0 small">
            Conformidade automática das escalas com CLT e convenções coletivas aplicáveis.
          </p>
        </div>
      </div>

      <UIComponentCard title="Compliance">
        <div class="legal-content">
          <h6>1. Conformidade com a CLT e Convenções Coletivas</h6>
          <p>
            O sistema valida automaticamente cada escala gerada com base nas regras da Consolidação
            das Leis do Trabalho (CLT) e nas convenções coletivas aplicáveis ao segmento.
          </p>

          <h6>Jornada máxima de trabalho</h6>
          <p>
            Jornada diária limitada a 8h (ou até 10h com banco de horas, conforme art. 59 da CLT).
          </p>
          <p>Jornada semanal máxima de 44 horas.</p>
          <p>
            Escalas que ultrapassem esses limites são bloqueadas automaticamente antes de serem
            salvas.
          </p>

          <h6>Intervalos obrigatórios</h6>
          <p>
            Intrajornada: mínimo de 1 hora de pausa para refeição em jornadas acima de 6h (art. 71
            da CLT).
          </p>
          <p>
            Interjornada: mínimo de 11 horas de descanso entre o fim de um turno e o início do próximo
            (art. 66 da CLT).
          </p>
          <p>Violações são identificadas antes da publicação da escala.</p>

          <h6>Descanso Semanal Remunerado (DSR)</h6>
          <p>
            Garantia de ao menos 1 dia de folga por semana, preferencialmente aos domingos (art. 67 da
            CLT).
          </p>
          <p>O sistema identifica semanas sem DSR garantido e bloqueia a escala.</p>

          <h6>Horas extras</h6>
          <p>Limite de 2 horas extras por dia (art. 59 da CLT).</p>
          <p>
            Identificação automática de escalas que gerariam horas extras não autorizadas.
          </p>

          <h6>Modelos de escala suportados</h6>
          <p>
            4x3, 5x2, 6x1 e 12x36 — cada modelo tem suas regras específicas validadas conforme a CLT
            e a CCT do segmento.
          </p>
        </div>
      </UIComponentCard>
    </div>
  </DefaultLayout>
</template>

<style scoped lang="scss">
.legal-content {
  display: grid;
  gap: 0.75rem;
  color: var(--bs-body-color);

  h6 {
    margin-top: 0.75rem;
    margin-bottom: 0.25rem;
  }

  p {
    margin-bottom: 0;
  }
}
</style>
