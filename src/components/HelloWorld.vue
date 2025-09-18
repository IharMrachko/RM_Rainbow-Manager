<template>
  <div>Привет CI/CD!</div>
  <div>{{ msg }}</div>
  <p>Count: {{ count }}</p>
  <p>Double: {{ double }}</p>
  <button @click="increment">+1</button>
  <button @click="incrementAsync">+1 через 1с</button>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue';
import { useStore } from 'vuex';

export default defineComponent({
  name: 'HelloWorld',
  props: {
    msg: {
      type: String,
      default: '',
    },
  },
  setup() {
    const store = useStore();
    const count = computed(() => store.state.count);
    const double = computed(() => store.getters.doubleCount);

    function increment() {
      store.commit('increment');
    }

    function incrementAsync() {
      store.dispatch('asyncIncrement');
    }

    return {
      count,
      double,
      increment,
      incrementAsync,
    };
  },
});
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
h3 {
  margin: 40px 0 0;
}

ul {
  list-style-type: none;
  padding: 0;
}

li {
  display: inline-block;
  margin: 0 10px;
}

a {
  color: #42b983;
}
</style>
