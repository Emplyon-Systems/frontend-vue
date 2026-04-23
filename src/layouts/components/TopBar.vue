<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import simplebar from "simplebar-vue";
import DropDown from "@/components/DropDown.vue";
import { useLayoutStore } from "@/stores/layout";
import { useAuthStore } from "@/stores/auth";
import { getPanelHomeForUser } from "@/config/panels";
import { useNotifications } from "@/composables/useNotifications";

const authStore = useAuthStore();
const router = useRouter();
const {
  items: notifications,
  unreadItems,
  readItems,
  total: notificationsCount,
  unreadCount,
  openNotification,
  openAllNotifications,
  markAllAsRead,
} = useNotifications();
const show = ref<"unread" | "read" | "all">("unread");

const myProfileRoute = computed(() => {
  const path = getPanelHomeForUser(authStore.user, authStore.activeContext) || "/";
  if (path.startsWith("/company")) return { name: "company.my-profile.view" };
  if (path.startsWith("/branch")) return { name: "branch.my-profile.view" };
  if (path.startsWith("/employee")) return { name: "employee.my-profile.view" };
  return { name: "owner.my-profile.view" };
});
const welcomeText = computed(() => {
  const options = authStore.getContextOptions();
  const ctx = authStore.activeContext ?? (options.length === 1 ? options[0] : null);

  if (ctx) {
    const contextName =
      (ctx.branch_id != null
        ? (ctx.branch_name ?? "").trim()
        : (ctx.company_name ?? "").trim()) || ctx.label;
    return `Bem Vindo, ${contextName}!`;
  }

  const name = authStore.user?.name || authStore.user?.email || "Usuário";
  return `Bem Vindo, ${name}!`;
});

function isActiveContext(ctx: { company_id: number; branch_id?: number | null }) {
  const ac = authStore.activeContext;
  if (!ac) return false;
  return ac.company_id === ctx.company_id && (ac.branch_id ?? null) === (ctx.branch_id ?? null);
}

function switchContext(ctx: { company_id: number; branch_id?: number | null; label: string }) {
  authStore.selectContext(ctx);
  const path = getPanelHomeForUser(authStore.user, ctx) || "/";
  if (window.location.pathname !== path) {
    window.location.href = path;
  }
}
const useLayout = useLayoutStore();
const { layout, setLeftSideBarSize } = useLayout;

const toggleTheme = () => {
  if (useLayout.layout.theme === "light") {
    return useLayout.setTheme("dark");
  }
  useLayout.setTheme("light");
};

const toggleLeftSideBar = () => {
  if (useLayout.layout.leftSideBarSize === "default") {
    return useLayout.setLeftSideBarSize("collapsed");
  }
  if (useLayout.layout.leftSideBarSize === "collapsed") {
    return useLayout.setLeftSideBarSize("default");
  }
};

const resize = () => {
  if (window.innerWidth < 1441) {
    setLeftSideBarSize("collapsed");
  } else {
    setLeftSideBarSize(
      layout.leftSideBarSize === "collapsed"
        ? "default"
        : layout.leftSideBarSize,
    );
  }
};

import avatar1 from "@/assets/images/users/avatar-1.jpg";

const windowScroll = () => {
  const navbar = document.getElementById("topbar-custom");
  if (navbar) {
    if (
      document.body.scrollTop >= 50 ||
      document.documentElement.scrollTop >= 50
    ) {
      navbar.classList.add("nav-sticky");
    } else {
      navbar.classList.remove("nav-sticky");
    }
  }
};

const leftSideBarClick = () => {
  window.addEventListener("click", (e: any) => {
    const startbar = document.getElementById("startbar");
    const togglemenu = document.getElementById("togglemenu");
    if (!(startbar && startbar.contains(e.target))) {
      if (window.innerWidth < 1441) {
        if (togglemenu && togglemenu.contains(e.target)) {
          setLeftSideBarSize("default");
        } else {
          setLeftSideBarSize("collapsed");
        }
      }
    }
  });
};

onMounted(() => {
  useLayout.init();
  resize();
  window.addEventListener("scroll", (ev) => {
    ev.preventDefault();
    windowScroll();
  });
  window.addEventListener("resize", () => {
    resize();
  });
  leftSideBarClick();
});
</script>

<template>
  <div class="topbar d-print-none">
    <div class="container-xxl">
      <nav
        class="topbar-custom d-flex justify-content-between"
        id="topbar-custom"
      >
        <ul
          class="topbar-item list-unstyled d-inline-flex align-items-center mb-0"
        >
          <li>
            <button
              class="nav-link mobile-menu-btn nav-icon"
              id="togglemenu"
              @click="toggleLeftSideBar"
            >
              <i class="iconoir-menu-scale"></i>
            </button>
          </li>
          <li class="mx-3 welcome-text d-flex align-items-center gap-2">
            <h3 class="mb-0 fw-bold text-truncate">{{ welcomeText }}</h3>
            <DropDown v-if="authStore.hasMultipleContexts()" is="span" custom-class="dropdown">
              <a
                class="nav-link dropdown-toggle arrow-none p-0"
                data-bs-toggle="dropdown"
                href="#"
                role="button"
                title="Trocar empresa/filial"
              >
                <i class="iconoir-building text-muted"></i>
              </a>
              <div class="dropdown-menu py-2">
                <a
                  v-for="ctx in authStore.getContextOptions()"
                  :key="ctx.branch_id ? `b-${ctx.company_id}-${ctx.branch_id}` : `c-${ctx.company_id}`"
                  href="#"
                  class="dropdown-item py-2"
                  :class="{ 'bg-primary-subtle': isActiveContext(ctx) }"
                  @click.prevent="switchContext(ctx)"
                >
                  <i class="iconoir-building me-2"></i>
                  {{ ctx.label }}
                </a>
              </div>
            </DropDown>
          </li>
        </ul>
        <ul
          class="topbar-item list-unstyled d-inline-flex align-items-center mb-0"
        >
          <li class="hide-phone app-search">
            <form role="search" action="#" method="get">
              <input
                type="search"
                name="search"
                class="form-control top-search mb-0"
                placeholder="Search here..."
              />
              <button type="button"><i class="iconoir-search"></i></button>
            </form>
          </li>
          <li class="topbar-item">
            <a
              class="nav-link nav-icon"
              href="javascript:void(0);"
              id="light-dark-mode"
              @click="toggleTheme"
            >
              <i class="icofont-sun dark-mode"></i>
              <i class="icofont-moon light-mode"></i>
            </a>
          </li>

          <DropDown is="li" custom-class="topbar-item">
            <a
              class="nav-link dropdown-toggle arrow-none nav-icon notification-bell-wrap"
              :class="{ 'notification-bell-pulse': unreadCount > 0 }"
              data-bs-toggle="dropdown"
              href="#"
              role="button"
              aria-haspopup="false"
              aria-expanded="false"
            >
              <i class="icofont-bell-alt"></i>
              <span v-if="unreadCount > 0" class="alert-badge alert-badge-strong">
                {{ unreadCount > 99 ? "99+" : unreadCount }}
              </span>
            </a>
            <div class="dropdown-menu stop dropdown-menu-end dropdown-lg py-0">
              <h5
                class="dropdown-item-text m-0 py-3 d-flex justify-content-between align-items-center"
              >
                Notificações
                <div class="d-flex align-items-center gap-2">
                  <b-badge v-if="unreadCount > 0" :variant="null" class="bg-warning-subtle text-warning">
                    {{ unreadCount }} não lida(s)
                  </b-badge>
                  <a href="#" class="badge text-body-tertiary badge-pill" @click.prevent="markAllAsRead">
                    <i class="iconoir-check-circle fs-5"></i>
                  </a>
                </div>
              </h5>
              <ul class="nav nav-tabs nav-tabs-custom nav-success nav-justified mb-1">
                <li class="nav-item">
                  <a class="nav-link mx-0" :class="show === 'unread' && 'active'" href="#" @click.prevent="show = 'unread'">
                    Não lidas
                    <b-badge :variant="null" class="bg-warning-subtle text-warning badge-pill ms-1">{{ unreadCount }}</b-badge>
                  </a>
                </li>
                <li class="nav-item">
                  <a class="nav-link mx-0" :class="show === 'read' && 'active'" href="#" @click.prevent="show = 'read'">
                    Lidas
                    <b-badge :variant="null" class="bg-secondary-subtle text-secondary badge-pill ms-1">{{ readItems.length }}</b-badge>
                  </a>
                </li>
                <li class="nav-item">
                  <a class="nav-link mx-0" :class="show === 'all' && 'active'" href="#" @click.prevent="show = 'all'">
                    Todas
                    <b-badge :variant="null" class="bg-primary-subtle text-primary badge-pill ms-1">{{ notificationsCount }}</b-badge>
                  </a>
                </li>
              </ul>
              <simplebar class="ms-0" style="max-height: 230px" data-simplebar>
                <div v-if="show === 'unread' ? unreadItems.length : show === 'read' ? readItems.length : notifications.length">
                  <a
                    v-for="item in show === 'unread' ? unreadItems : show === 'read' ? readItems : notifications"
                    :key="item.id"
                    href="#"
                    class="dropdown-item py-3"
                    @click.prevent="openNotification(item)"
                  >
                    <small class="float-end text-muted ps-2">{{ item.dateLabel }}</small>
                    <div class="d-flex align-items-center">
                      <div class="flex-shrink-0 thumb-md rounded-circle" :class="item.iconVariantClass || 'bg-primary-subtle text-primary'">
                        <i :class="item.iconClass || 'iconoir-bell fs-4'"></i>
                      </div>
                      <div class="flex-grow-1 ms-2 text-truncate">
                        <h6 class="my-0 fw-normal text-dark fs-13">{{ item.title }}</h6>
                        <small class="text-muted mb-0">{{ item.message }}</small>
                      </div>
                    </div>
                  </a>
                </div>
                <div v-else class="py-3 px-3 text-muted small">
                  {{
                    show === "unread"
                      ? "Sem notificações não lidas."
                      : show === "read"
                        ? "Sem notificações lidas."
                        : "Sem notificações no momento."
                  }}
                </div>
              </simplebar>
              <a
                href="#"
                class="dropdown-item text-center text-dark fs-13 py-2"
                @click.prevent="openAllNotifications"
              >
                Ver tudo <i class="fi-arrow-right"></i>
              </a>
            </div>
          </DropDown>

          <DropDown is="li" custom-class="topbar-item">
            <a
              class="nav-link dropdown-toggle arrow-none nav-icon"
              data-bs-toggle="dropdown"
              href="#"
              role="button"
              aria-haspopup="false"
              aria-expanded="false"
            >
              <img :src="avatar1" alt="" class="thumb-lg rounded-circle" />
            </a>
            <div class="dropdown-menu dropdown-menu-end py-0">
              <div
                class="d-flex align-items-center dropdown-item py-2 bg-secondary-subtle"
              >
                <div class="flex-shrink-0">
                  <img :src="avatar1" alt="" class="thumb-md rounded-circle" />
                </div>
                <div class="flex-grow-1 ms-2 text-truncate align-self-center">
                  <h6 class="my-0 fw-medium text-dark fs-13">{{ authStore.user?.name || authStore.user?.email || 'Usuário' }}</h6>
                  <small class="text-muted mb-0">{{ authStore.user?.roles?.[0]?.name || '' }}</small>
                </div>
              </div>
              <div class="dropdown-divider mt-0"></div>
              <small class="text-muted px-2 pb-1 d-block">Conta</small>
              <router-link class="dropdown-item" to="/">
                <i class="las la-home fs-18 me-1 align-text-bottom"></i>
                Dashboard
              </router-link>
              <router-link :to="myProfileRoute" class="dropdown-item">
                <i class="las la-user fs-18 me-1 align-text-bottom"></i>
                Meu perfil
              </router-link>
              <div class="dropdown-divider mb-0"></div>
              <a
                href="#"
                class="dropdown-item text-danger"
                @click.prevent="authStore.logout()"
              >
                <i class="las la-power-off fs-18 me-1 align-text-bottom"></i>
                Logout
              </a>
            </div>
          </DropDown>
        </ul>
      </nav>
    </div>
  </div>
</template>

<style scoped>
.notification-bell-pulse {
  animation: notification-pulse 1.2s ease-in-out infinite;
}

.notification-bell-pulse i {
  color: #ff7a45;
}

.notification-bell-wrap {
  position: relative;
}

.alert-badge-strong {
  position: absolute;
  top: -6px;
  right: -6px;
  background-color: #ff7a45 !important;
  color: #fff !important;
  border: 1px solid #ff6a2f;
  font-weight: 700;
  min-width: 18px;
  height: 18px;
  line-height: 16px;
  text-align: center;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
}

@keyframes notification-pulse {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.18);
    opacity: 0.8;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}
</style>
