<template>
    <div class="player">
        <img v-bind:class="cheaterProbability(player.cheaterProbability)" @click="logData" :src="player.playerIcon">
        <a @click="visitLink" class="player_name">  {{player.playerName}}</a>
        {{player.headShotRatio}} | {{player.winlossRatio}} | {{(player.cheaterProbability)}}
    </div>
</template>

<script>

export default {
    name: 'Player',
    data(){
        return{
            // player:{
            //     playerName: String,
            //     avatar: String,
            //     headShotRatio: Number,
            //     winlossRatio: Number,
            //     cheaterProbability: Number,
            //     steamLink: String, 
            // }
        }
    },
    props:{
        player: Object,
    },
    methods:{
        visitLink: function(){
            window.open(this.player.steamLink,'_blank')
        },
         calculateProbability: function(n){
            return n
        },
        logData: function(){
            console.log(this.player); 
        },
        clamp: function(input, min, max) {
        return input < min ? min : input > max ? max : input;
         },
        map: function (current, in_min, in_max, out_min, out_max){
            const mapped = ((current - in_min) * (out_max - out_min)) / (in_max - in_min) + out_min;
            return this.clamp(mapped, out_min, out_max);
        },
        cheaterProbability: function(n){
            // n range 0 - 10 or some shit 
            const imgClasses = ['cheating_probability_zero','cheating_probability_low','cheating_probability_moderate','cheating_probability_high','cheating_probability_extreme']
            let index = Math.floor(this.map(n,0,10,0,6))
            console.log(index); 
            return imgClasses[index]; 
        }
    },
    computed:{
       
    }
}
</script>

<style scoped>
    .player{
        background-color: rgba(128, 128, 128, 0.356);
        width: 33vw;
        display: flex;
        justify-content: space-between;
        align-items: center; 

    }
    .cheating_probability_zero{
        border: 1px solid green;
    }
    .cheating_probability_low{
        border: 1px solid rgb(47, 128, 0);

    }
    .cheating_probability_moderate{
        border: 1px solid rgb(128, 119, 0);
  
    }
    .cheating_probability_high{
        border: 1px solid rgb(128, 77, 0);

    }
    .cheating_probability_extreme{
        border: 1px solid rgb(128, 0, 0);
    }
    a:hover{
        cursor: pointer; 
    }
</style>
