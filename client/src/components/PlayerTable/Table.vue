<template>
    <div class="player_table">
        <!-- <Player :v-for="player in players" :player="player"/> -->
        <li v-for="player in players" v-bind:key="player.playerName">
            <Player :player="player"/>
        </li>
        <!-- <Player :player="players['player1']"/> -->
    </div>
</template>

<script>
import Player from './Player.vue'
export default {
    name: 'Table',
    components:{
        Player,
    },
    data(){
        return {
           
        }
    },
    props:{
        players: Array,
    },
    methods:{
        rearange: function (a,b){
            // get indecies of a/b, rearange them, then rerender
            return a,b;
        }
    }
}
</script>

<style scoped>
.div{
    width: 66%;
}
</style>