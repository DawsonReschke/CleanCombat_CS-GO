# CleanCombat CS:GO
I enjoy playing Counter-strike (CS), but playing against cheaters can be really demotivating. To counteract this I have 
created a cheater detector for CS by using the [Steam Web API](https://partner.steamgames.com/doc/webapi_overview). I 
have also created a front-end application to interface with this api, see the [repo here](https://github.com/DawsonReschke/Cheater_detector_Client).
This program works by obtaining a large set of data from the Steam Web API and storing it in a database for later 
analysis. I compare each player using non-biased techniques, to determine how likely it is that a given player is cheating. 
   
## Calculating cheater probability:   
My initial idea for anomaly detection was to look at each player within a single lobby of players
(10 players), compare each of their stats to the mean stats of that lobby, and if any player were significantly better
(determined by hardcoded threshold), I would then consider that specific statistic an anomaly. 
	The aforementioned estimator is obviously flawed. One issue that was holding me back was the inability to compare
stats from a list of past players. Each player is at a different skill level, this means if I compared players with a 
significantly better skill set than players that are just bad, the good players would be considered probably cheating.    
A solution for normalizing the data looks like this:    
	let x = current.player.overall.accuracy   
	let y = current.player.GUN.accuracy // GUN is stand in for each gun id (28 of them)    

We can infer that y is in some way correlated to x :: consider if a player had 100% overall accuracy, 
we must know that each gun accuracy is also 100% that is true for 0's as well.   

keeping this relationship in mind, we can take the quotient of (Y/X) and assume that the output of this would be
normalized. (something that we could compare for bad & good players)    

Using this new set of normalized data points we can now begin to search for anomalies. The first idea a person 
might have would be similar to my initial idea: for each gun find the sum of all players normalized gun accuracy,
divide by the number of players, and compare each player to this mean using a threshold. The issue here is that having 
a hard-coded threshold number seems quite biased. I need a function to be deterministic using statistical probabilities. 
My next idea was as follows: for each normalized data set, use standard deviation to determine anomaly.   
```
Standard deviation: sqrt(veriance(x))
	veriance: measures the average distance from objects in a set, to the mean location of each object in the set. 
veriance(x) : // where x is [] of numbers
	mean = 0;
	for i in range(x):
		mean += x[i]
	mean /= x.len
	averageDistanceFromMean = 0
	for i in range(x):
		averageDistanceFromMean += (x[i] - mean) ^ 2
	return averageDistanceFromMean / x.len
```  
STD probabilites:  
	0 - 1 STD | 1 - 2 STD | 3 - N STD |   
	    68%		95%	   97+%  
keeping these probabilities in mind we can see that anything above 2.5 standard deviations from the mean is very unlikely,
and we consider that an anomaly. 
Finding how many standard deviations a point is from the mean looks like this: // finding the z-score  
	   zscore = (point - mean) / Standard Deviation   
  
This method of anomaly detection is okay, one thing that you might notice though, we are using the mean of the dataset for
calculating the anomaly confidence. It isn't inherently obvious how quickly this method could break apart. In statistics,
we think about the robustness of a particular estimator as the resistance to abnormalities.  
Consider this:   
```
let x = [ 10 , 10 , 10 , 10 ]  
  mean(x) = 10  
// lets add in an anomaly  
x = [ 10, 10, 10, 100 ]   
  mean(x) = 32.5  
```
Just by having one anomaly in the dataset our ability to confidently predict anomalies goes down significantly 
To keep it short 100 would not be considered an anomaly using the zscore from standard deviation, this is why 
I chose a different, more robust estimator for this project.
```
Median Absolute Deviation(x): //(MAD)
	k = 1.4826 // I should note that k is a scale factor used and depends on your data, ours is normally distributed
	x.sort()
	median = x[x.len/2]
	absoluteDeviations = []
	for i in range(x): 
		absoluteDeviations.push(abs(x[i] - median)) // fill the new list with the distances from each point to the median
	absoluteDeviations.sort()
	MAD = k * absoluteDeviations[absoluteDeviations.len / 2] // constant * median of these new values. 
```
Using MAD to calculate zscore is very similar to STD:   
```
	zscore = (point - median) / MAD		// again scores higher than 2.5/3 would be considered anomalies
```
Earlier I mentioned robustness of an estimator, let's look at the robustness of this estimator:   
```
consider the set x = [10.1, 10.2, 10.3, 100.4]    
median = 10.25 			// (10.2 + 10.3) / 2   
absoluteDeviations = [0.05, 0.05, 0.15, 90.15]  
MAD = 1.4862 * ((0.05 + 0.15)/2) = 0.14862   
```
To keep it short the anomaly gives us a zscore of 600, slightly higher than our threshold of 3.   

Using a median-based estimator is significantly more robust, in fact around 50% of the data would have to be anomalies to skew the estimator falsely.    

One thing to note is that in the code examples above I said that the median = x[x.len/2] this is not correct:   
```
if(x.len is odd): 
	median = x[x.len/2]
if(x.len is even):
	median = 1/2 * (x[x.len/2] + x[x.len/2 - 1])
```
