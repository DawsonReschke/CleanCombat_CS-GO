<template>
<div>
  <img alt="Vue logo" src="./assets/logo.png">
  <Table :players="players"/>
  <textarea v-model="value"> </textarea>
  <button @click="logValue"> click </button>
</div>
</template>

<script>
import Table from './components/PlayerTable/Table.vue'
export default {
  name: 'App',
  data(){
    return{
      value: "",
      players: [
          {
                playerName: 'dawson',
                playerIcon: 'https://steamcdn-a.akamaihd.net/steamcommunity/public/images/avatars/21/217ccd4b4c1a10f06b4dd7c58f732a31d7d4c12f.jpg',
                headShotRatio: 100,
                winlossRatio: 100,
                cheaterProbability: 0,
                steamLink: 'https://steamcommunity.com/profiles/76561198213188081/', 
          },
          {
                playerName: 'random',
                avatar: 'ez.img',
                headShotRatio: 33,
                winlossRatio: 45,
                cheaterProbability: 8,
                steamLink: 'fjakd', 
          },
      ]
    }
  },
  methods:{
    logValue: function (){
      // console.log(this.value);
      console.log(String.raw`${this.value}`); 
    }
  },
  components: {
    Table,
  }
}
</script>

<style>
#app {
  width: 100%; 
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
