<script setup lang="ts">
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import UIComponentCard from "@/components/UIComponentCard.vue";
</script>

<template>
  <DefaultLayout>
    <div class="py-4">
      <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
        <div>
          <h1 class="h4 mb-1">Termos de Uso</h1>
          <p class="text-muted mb-0 small">
            Condições para utilização do sistema Emplyon por usuários autenticados.
          </p>
        </div>
      </div>

      <UIComponentCard title="Termos de Uso">
        <div class="legal-content">
          <p>
            Ao acessar e utilizar o sistema Emplyon, o usuário declara estar ciente e de acordo com
            os termos descritos nesta página.
          </p>

          <h6>1. Acesso ao sistema</h6>
          <p>
            O acesso é pessoal e vinculado às credenciais de autenticação fornecidas. O usuário é
            responsável pelo uso adequado da sua conta e pela confidencialidade da senha.
          </p>

          <h6>2. Uso permitido</h6>
          <p>
            O sistema deve ser utilizado exclusivamente para finalidades operacionais autorizadas,
            respeitando políticas internas da organização e a legislação vigente.
          </p>

          <h6>3. Condutas vedadas</h6>
          <p>
            É proibido tentar obter acesso não autorizado, alterar dados sem permissão, realizar uso
            indevido de funcionalidades ou comprometer a segurança da aplicação.
          </p>

          <h6>4. Responsabilidades</h6>
          <p>
            O usuário deve manter seus dados atualizados e reportar incidentes de segurança, falhas ou
            acessos suspeitos ao responsável pelo sistema.
          </p>

          <h6>5. Disponibilidade e manutenção</h6>
          <p>
            O serviço pode passar por manutenções e evoluções para melhoria contínua, podendo ocorrer
            indisponibilidades temporárias planejadas ou emergenciais.
          </p>

          <h6>6. Atualizações dos termos</h6>
          <p class="mb-0">
            Estes termos podem ser revisados periodicamente. A continuidade de uso após atualizações
            representa concordância com a versão vigente.
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
