import {createStore, createLogger} from 'vuex'

export default createStore({
    state: {
        count: 0,
    },
    getters: {
        doubleCount: state => state.count * 2
    },
    mutations: {
        increment(state) {
            state.count++
        },
        setCount(state, value) {
            state.count = value
        }
    },
    actions: {
        asyncIncrement({commit}) {
            setTimeout(() => {
                commit('increment')
            }, 1000)
        }
    },
    modules: {},
    plugins: [createLogger()]
})
