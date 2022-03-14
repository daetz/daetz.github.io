//https://stackoverflow.com/questions/1255512/how-to-draw-a-rounded-rectangle-using-html-canvas
CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    this.beginPath();
    this.moveTo(x+r, y);
    this.arcTo(x+w, y,   x+w, y+h, r);
    this.arcTo(x+w, y+h, x,   y+h, r);
    this.arcTo(x,   y+h, x,   y,   r);
    this.arcTo(x,   y,   x+w, y,   r);
    this.closePath();
    return this;
}

let mx = 0; //mouse x
let my = 0; //mouse y
const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const fontSize = 30;
const kerning = fontSize*5/4;
const linespace = kerning;
const c = document.getElementById("myCanvas");
const ctx = c.getContext("2d");

var sourceText;
const quotes = getQuotes();
var message = quotes[Math.floor(quotes.length*Math.random())].toUpperCase();
const keyLength = 8;
const wrapLength = 21; //incomprehensibilities is the longest common english word
var key;

var lines = [], initLetters = [], letters = [], punctuation = [];
const letterX = [], letterY = [], punctX = [], punctY = [];
const hexColors = ["#b2a69e","#c7a379","#bebefa","#c6c97b","#dec8af","#a7b39b","#a69eb2","#eba893"];
var letterClicked = -1;

key=createRandomKey(keyLength);
createLetters();
encrypt(key);
lines = wrapLines(message,wrapLength);
createCharacterCoordinates();
const messageData = getMessageData();
repaint();

function getMessageData(){
	let messageData = [];
    //total letters
    messageData.push(letters.length);
    let regexpWord = /\b[A-Z']+\b/g;
    let words = message.match(regexpWord);
    //total words
    messageData.push(words.length);
    //average word length
    messageData.push(letters.length/words.length);
    //first word length
    messageData.push(words[0].length);
	
	let oneLetterWords = 0, twoLetterWords = 0;
	for(let i=0; i<words.length; i++){
		let wordLength = words[i].match(/[A-Z]/g).length; //this way contractions are still counted (e.x I'm has 2 letters)
		if(wordLength == 1)
			oneLetterWords ++;
		else if(wordLength == 2)
			twoLetterWords ++;
	}
    //one-letter words
    messageData.push(oneLetterWords);
    //two-letter words
    messageData.push(twoLetterWords);
    //contractions -- ternary operator prevents error if no matches found
    messageData.push(message.match(/\w'\w/g) == null ? 0 : message.match(/\w'\w/g).length);

    console.table(messageData);
	return messageData;
}

function repaint(){
    let size = 20;
    clear();
    for(let i=0; i<letterX.length; i++){

		//Draws tiles
        ctx.fillStyle = hexColors[i%keyLength];
        ctx.roundRect(letterX[i]-fontSize/2,letterY[i]-fontSize/2,fontSize,fontSize,fontSize/4).fill();
       
		//Draws letters
        ctx.font = `${fontSize}px monospace`;
        ctx.textAlign = "center"; //these two lines mean that the same tile coordinates can be used...
        ctx.textBaseline = "middle"; //...because the letters will be centered at (x,y)
        ctx.fillStyle = '#423126'; //nice brown color :)
		if(i%keyLength==letterClicked%keyLength) //highlights all letters of same tile color as selected tile
			ctx.fillStyle = '#FFFFFFAA'; //translucent white so tile color shows through
        ctx.fillText(letters[i],letterX[i],letterY[i]);
		
		//Outlines selected tile
		ctx.strokeStyle = '#423126';
		if(letterClicked==i)
			ctx.roundRect(letterX[i]-fontSize/2,letterY[i]-fontSize/2,fontSize,fontSize,fontSize/4).stroke();
    }

    ctx.fillStyle = '#423126';
    for(let i=0; i<punctX.length; i++){
        ctx.fillText(punctuation[i],punctX[i],punctY[i]);
    }
}

function clear(){
    ctx.clearRect(0,0,c.width,c.height); //clears canvas
}

function createRandomKey(keyLength){
    let key = "";
    for(let i=0; i<keyLength; i++)
        key+=chars.charAt(Math.floor(1+(25*Math.random())));
    return key;
}

function createLetters(){
    let index;
	for(let i=0; i<message.length; i++) {
		index = chars.indexOf(message.charAt(i));
		if (index>-1) { //checking if it is a letter
			initLetters.push(message.charAt(i));
			letters.push(message.charAt(i));
		}else if(message.charAt(i)!=' '){
			punctuation.push(message.charAt(i));
		}	
	}
}

function encrypt(key){
    let index;
    for(let i=0; i<letters.length; i++){
        index = chars.indexOf(letters[i])
        letters[i] = chars.charAt((index+chars.indexOf(key.charAt(i%key.length)))%chars.length);
    }
}

function wrapLines(message, length){ //just a simple, clean text wrapper that takes a message and wrap length and returns an array of lines
    let lines = [];

	let lastValidSpace = 0;
    let nextSpace = 0;
    let startLine = 0;
    
    while(message.length-startLine > length)  { 
        lastValidSpace = startLine;
        nextSpace = message.indexOf(' ',lastValidSpace);
        while(nextSpace<=startLine+length && nextSpace>-1) {
            lastValidSpace = nextSpace;
            nextSpace = message.indexOf(' ',lastValidSpace+1);
        }
        if(lastValidSpace == startLine) {
            lines.push(message.substring(startLine,startLine+length));
            startLine+=length;
        }else {
            lines.push(message.substring(startLine,lastValidSpace));
            startLine=lastValidSpace+1;
        }
    }
    lines.push(message.substring(startLine, message.length));
	return lines;
}

function createCharacterCoordinates(){
    let index;
	for(let i=0; i<lines.length; i++) {
		for(let j=0; j<lines[i].length; j++) {
			index = chars.indexOf(lines[i].charAt(j));
			if (index>-1) {
				letterX.push(c.width/2+kerning*(2*j+1-lines[i].length)/2);
				letterY.push(c.height/2+linespace*(2*i+1-lines.length)/2);
			}else if(lines[i].charAt(j)!=' '){
				punctX.push(c.width/2+kerning*(2*j+1-lines[i].length)/2);
				punctY.push(c.height/2+linespace*(2*i+1-lines.length)/2);
			}
		}
	}
}

function getLetterClicked(x,y){
    letterClicked = -1;
    for(let i=0; i<letters.length; i++)
        if(x>letterX[i]-fontSize/2 && x<letterX[i]+fontSize/2 && y>letterY[i]-fontSize/2 && y<letterY[i]+fontSize/2)
            letterClicked = i;
}

function shiftLetter(index,newLetter){
    let shiftKey = "";
		let shift = chars.indexOf(newLetter)-chars.indexOf(letters[index]);
		shift = (shift+chars.length)%chars.length; //need to account for negative numbers now!
		for(let i=0; i<keyLength; i++) {
			if(i==index%keyLength)
				shiftKey+=chars.charAt(shift);
			else
				shiftKey+='A';
		}
		//System.out.println(shiftKey);
		encrypt(shiftKey);
		letterClicked = -1;
}

c.addEventListener('keydown', e => {
    if(letterClicked>-1){ //change this to mode==TYPING
        let keyDown = e.key.toUpperCase();
        if(chars.indexOf(keyDown)>-1){
            shiftLetter(letterClicked,keyDown);
            repaint();
        }
    }
});

c.addEventListener('mousedown', e => {
    mx = e.offsetX;
    my = e.offsetY;
    getLetterClicked(mx,my);
    repaint();
});

function getQuotes(){ //this is messy due to shift from text file to API call... it'll soon change again for database query
    /*loadSourceText();
    let end = 10; //avoids "quotes" near beginning of json
    let start;
		do {
			start = sourceText.indexOf("quote", end);
			end = sourceText.indexOf("author",start);
			if(start!=-1) {
				quotes.push(sourceText.substring(start+8,end-3));
			}
		}while(start!=-1);*/
		let quotes = [];
		let Http = new XMLHttpRequest();
		const url='https://goquotes-api.herokuapp.com/api/v1/all/quotes';
		Http.open("GET",url,false);
		Http.onreadystatechange = (e) => {
	
			var rawQuotes = [];
			const rawText = Http.responseText;
			const general = rawText.match(/status.+\"general\"/g)[0]; //keeps general quotes only
			rawQuotes = general.match(/\"text\":.+?\"author\":/g);
			for(let i=0; i<rawQuotes.length; i++){
				let candidate = rawQuotes[i].substring(8,rawQuotes[i].length-11);
				if(!(/\d/g).test(candidate)){ //no digits
					if(candidate.match(/[A-Za-z]/g).length<80){ //no more than 80 letters
						quotes.push(candidate);
					}
				}
			}
			//console.log("How many? " + quotes.length);
		}
		Http.send();
		return quotes;
}

//gross original source text (not currently being used)
function loadSourceText(){
    sourceText = ("{\n"
				+ "	\"quotes\": [\n"
				+ "\n"
				+ "{\n"
				+ "       \"quote\":\"Life isn\'t about getting and having, it\'s about giving and being.\",\"author\":\"Kevin Kruse\"},\n"
				+ "{\n"
				+ "       \"quote\":\"Whatever the mind of man can conceive and believe, it can achieve.\",\"author\":\"Napoleon Hill\"},\n"
				+ "{\n"
				+ "       \"quote\":\"Strive not to be a success, but rather to be of value.\",\"author\":\"Albert Einstein\"},\n"
				+ "{\n"
				+ "       \"quote\":\"Two roads diverged in a wood, and I—I took the one less traveled by, And that has made all the difference.\",\"author\":\"Robert Frost\"},\n"
				+ "{\n"
				+ "       \"quote\":\"I attribute my success to this: I never gave or took any excuse.\",\"author\":\"Florence Nightingale\"},\n"
				+ "{\n"
				+ "       \"quote\":\"You miss 100% of the shots you don\'t take.\",\"author\":\"Wayne Gretzky\"},\n"
				+ "{\n"
				+ "       \"quote\":\"I\'ve missed more than 9000 shots in my career. I\'ve lost almost 300 games. 26 times I\'ve been trusted to take the game winning shot and missed. I\'ve failed over and over and over again in my life. And that is why I succeed.\",\"author\":\"Michael Jordan\"},\n"
				+ "{\n"
				+ "       \"quote\":\"The most difficult thing is the decision to act, the rest is merely tenacity.\",\"author\":\"Amelia Earhart\"},\n"
				+ "{\n"
				+ "       \"quote\":\"Every strike brings me closer to the next home run.\",\"author\":\"Babe Ruth\"},\n"
				+ "{\n"
				+ "       \"quote\":\"Definiteness of purpose is the starting point of all achievement.\",\"author\":\"W. Clement Stone\"},\n"
				+ "{\n"
				+ "       \"quote\":\"We must balance conspicuous consumption with conscious capitalism.\",\"author\":\"Kevin Kruse\"},\n"
				+ "{\n"
				+ "       \"quote\":\"Life is what happens to you while you\'re busy making other plans.\",\"author\":\"John Lennon\"},\n"
				+ "{\n"
				+ "       \"quote\":\"We become what we think about.\",\"author\":\"Earl Nightingale\"},\n"
				+ "{\n"
				+ "       \"quote\":\"Twenty years from now you will be more disappointed by the things that you didn\'t do than by the ones you did do, so throw off the bowlines, sail away from safe harbor, catch the trade winds in your sails.  Explore, Dream, Discover.\",\"author\":\"Mark Twain\"},\n"
				+ "{\n"
				+ "       \"quote\":\"Life is 10% what happens to me and 90% of how I react to it.\",\"author\":\"Charles Swindoll\"},\n"
				+ "{\n"
				+ "       \"quote\":\"The most common way people give up their power is by thinking they don\'t have any.\",\"author\":\"Alice Walker\"},\n"
				+ "{\n"
				+ "       \"quote\":\"The mind is everything. What you think you become.\",\"author\":\"Buddha\"},\n"
				+ "{\n"
				+ "       \"quote\":\"The best time to plant a tree was 20 years ago. The second best time is now.\",\"author\":\"Chinese Proverb\"},\n"
				+ "{\n"
				+ "       \"quote\":\"An unexamined life is not worth living.\",\"author\":\"Socrates\"},\n"
				+ "{\n"
				+ "       \"quote\":\"Eighty percent of success is showing up.\",\"author\":\"Woody Allen\"},\n"
				+ "{\n"
				+ "       \"quote\":\"Your time is limited, so don\'t waste it living someone else\'s life.\",\"author\":\"Steve Jobs\"},\n"
				+ "{\n"
				+ "       \"quote\":\"Winning isn\'t everything, but wanting to win is.\",\"author\":\"Vince Lombardi\"},\n"
				+ "{\n"
				+ "       \"quote\":\"I am not a product of my circumstances. I am a product of my decisions.\",\"author\":\"Stephen Covey\"},\n"
				+ "{\n"
				+ "       \"quote\":\"Every child is an artist.  The problem is how to remain an artist once he grows up.\",\"author\":\"Pablo Picasso\"},\n"
				+ "{\n"
				+ "       \"quote\":\"You can never cross the ocean until you have the courage to lose sight of the shore.\",\"author\":\"Christopher Columbus\"},\n"
				+ "{\n"
				+ "       \"quote\":\"I\'ve learned that people will forget what you said, people will forget what you did, but people will never forget how you made them feel.\",\"author\":\"Maya Angelou\"},\n"
				+ "{\n"
				+ "       \"quote\":\"Either you run the day, or the day runs you.\",\"author\":\"Jim Rohn\"},\n"
				+ "{\n"
				+ "       \"quote\":\"Whether you think you can or you think you can\'t, you\'re right.\",\"author\":\"Henry Ford\"},\n"
				+ "{\n"
				+ "       \"quote\":\"The two most important days in your life are the day you are born and the day you find out why.\",\"author\":\"Mark Twain\"},\n"
				+ "{\n"
				+ "       \"quote\":\"Whatever you can do, or dream you can, begin it.  Boldness has genius, power and magic in it.\",\"author\":\"Johann Wolfgang von Goethe\"},\n"
				+ "{\n"
				+ "       \"quote\":\"The best revenge is massive success.\",\"author\":\"Frank Sinatra\"},\n"
				+ "{\n"
				+ "       \"quote\":\"People often say that motivation doesn\'t last. Well, neither does bathing.  That\'s why we recommend it daily.\",\"author\":\"Zig Ziglar\"},\n"
				+ "{\n"
				+ "       \"quote\":\"Life shrinks or expands in proportion to one\'s courage.\",\"author\":\"Anais Nin\"},\n"
				+ "{\n"
				+ "       \"quote\":\"If you hear a voice within you say “you cannot paint,” then by all means paint and that voice will be silenced.\",\"author\":\"Vincent Van Gogh\"},\n"
				+ "{\n"
				+ "       \"quote\":\"There is only one way to avoid criticism: do nothing, say nothing, and be nothing.\",\"author\":\"Aristotle\"},\n"
				+ "{\n"
				+ "       \"quote\":\"Ask and it will be given to you; search, and you will find; knock and the door will be opened for you.\",\"author\":\"Jesus\"},\n"
				+ "{\n"
				+ "       \"quote\":\"The only person you are destined to become is the person you decide to be.\",\"author\":\"Ralph Waldo Emerson\"},\n"
				+ "{\n"
				+ "       \"quote\":\"Go confidently in the direction of your dreams.  Live the life you have imagined.\",\"author\":\"Henry David Thoreau\"},\n"
				+ "{\n"
				+ "       \"quote\":\"When I stand before God at the end of my life, I would hope that I would not have a single bit of talent left and could say, I used everything you gave me.\",\"author\":\"Erma Bombeck\"},\n"
				+ "{\n"
				+ "       \"quote\":\"Few things can help an individual more than to place responsibility on him, and to let him know that you trust him.\",\"author\":\"Booker T. Washington\"},\n"
				+ "{\n"
				+ "       \"quote\":\"Certain things catch your eye, but pursue only those that capture the heart.\",\"author\":\" Ancient Indian Proverb\"},\n"
				+ "{\n"
				+ "       \"quote\":\"Believe you can and you\'re halfway there.\",\"author\":\"Theodore Roosevelt\"},\n"
				+ "{\n"
				+ "       \"quote\":\"Everything you\'ve ever wanted is on the other side of fear.\",\"author\":\"George Addair\"},\n"
				+ "{\n"
				+ "       \"quote\":\"We can easily forgive a child who is afraid of the dark; the real tragedy of life is when men are afraid of the light.\",\"author\":\"Plato\"},\n"
				+ "{\n"
				+ "       \"quote\":\"Teach thy tongue to say, “I do not know,” and thous shalt progress.\",\"author\":\"Maimonides\"},\n"
				+ "{\n"
				+ "       \"quote\":\"Start where you are. Use what you have.  Do what you can.\",\"author\":\"Arthur Ashe\"},\n"
				+ "{\n"
				+ "       \"quote\":\"When I was 5 years old, my mother always told me that happiness was the key to life.  When I went to school, they asked me what I wanted to be when I grew up.  I wrote down ‘happy\'.  They told me I didn\'t understand the assignment, and I told them they didn\'t understand life.\",\"author\":\"John Lennon\"},\n"
				+ "{\n"
				+ "       \"quote\":\"Fall seven times and stand up eight.\",\"author\":\"Japanese Proverb\"},\n"
				+ "{\n"
				+ "       \"quote\":\"When one door of happiness closes, another opens, but often we look so long at the closed door that we do not see the one that has been opened for us.\",\"author\":\"Helen Keller\"},\n"
				+ "{\n"
				+ "       \"quote\":\"Everything has beauty, but not everyone can see.\",\"author\":\"Confucius\"},\n"
				+ "{\n"
				+ "       \"quote\":\"How wonderful it is that nobody need wait a single moment before starting to improve the world.\",\"author\":\"Anne Frank\"},\n"
				+ "{\n"
				+ "       \"quote\":\"When I let go of what I am, I become what I might be.\",\"author\":\"Lao Tzu\"},\n"
				+ "{\n"
				+ "       \"quote\":\"Life is not measured by the number of breaths we take, but by the moments that take our breath away.\",\"author\":\"Maya Angelou\"},\n"
				+ "{\n"
				+ "       \"quote\":\"Happiness is not something readymade.  It comes from your own actions.\",\"author\":\"Dalai Lama\"},\n"
				+ "{\n"
				+ "       \"quote\":\"If you\'re offered a seat on a rocket ship, don\'t ask what seat! Just get on.\",\"author\":\"Sheryl Sandberg\"},\n"
				+ "{\n"
				+ "       \"quote\":\"First, have a definite, clear practical ideal; a goal, an objective. Second, have the necessary means to achieve your ends; wisdom, money, materials, and methods. Third, adjust all your means to that end.\",\"author\":\"Aristotle\"},\n"
				+ "{\n"
				+ "       \"quote\":\"If the wind will not serve, take to the oars.\",\"author\":\"Latin Proverb\"},\n"
				+ "{\n"
				+ "       \"quote\":\"You can\'t fall if you don\'t climb.  But there\'s no joy in living your whole life on the ground.\",\"author\":\"Unknown\"},\n"
				+ "{\n"
				+ "       \"quote\":\"We must believe that we are gifted for something, and that this thing, at whatever cost, must be attained.\",\"author\":\"Marie Curie\"},\n"
				+ "{\n"
				+ "       \"quote\":\"Too many of us are not living our dreams because we are living our fears.\",\"author\":\"Les Brown\"},\n"
				+ "{\n"
				+ "       \"quote\":\"Challenges are what make life interesting and overcoming them is what makes life meaningful.\",\"author\":\"Joshua J. Marine\"},\n"
				+ "{\n"
				+ "       \"quote\":\"If you want to lift yourself up, lift up someone else.\",\"author\":\"Booker T. Washington\"},\n"
				+ "{\n"
				+ "       \"quote\":\"I have been impressed with the urgency of doing. Knowing is not enough; we must apply. Being willing is not enough; we must do.\",\"author\":\"Leonardo da Vinci\"},\n"
				+ "{\n"
				+ "       \"quote\":\"Limitations live only in our minds.  But if we use our imaginations, our possibilities become limitless.\",\"author\":\"Jamie Paolinetti\"},\n"
				+ "{\n"
				+ "       \"quote\":\"You take your life in your own hands, and what happens? A terrible thing, no one to blame.\",\"author\":\"Erica Jong\"},\n"
				+ "{\n"
				+ "       \"quote\":\"What\'s money? A man is a success if he gets up in the morning and goes to bed at night and in between does what he wants to do.\",\"author\":\"Bob Dylan\"},\n"
				+ "{\n"
				+ "       \"quote\":\"I didn\'t fail the test. I just found 100 ways to do it wrong.\",\"author\":\"Benjamin Franklin\"},\n"
				+ "{\n"
				+ "       \"quote\":\"In order to succeed, your desire for success should be greater than your fear of failure.\",\"author\":\"Bill Cosby\"},\n"
				+ "{\n"
				+ "       \"quote\":\"A person who never made a mistake never tried anything new.\",\"author\":\" Albert Einstein\"},\n"
				+ "{\n"
				+ "       \"quote\":\"The person who says it cannot be done should not interrupt the person who is doing it.\",\"author\":\"Chinese Proverb\"},\n"
				+ "{\n"
				+ "       \"quote\":\"There are no traffic jams along the extra mile.\",\"author\":\"Roger Staubach\"},\n"
				+ "{\n"
				+ "       \"quote\":\"It is never too late to be what you might have been.\",\"author\":\"George Eliot\"},\n"
				+ "{\n"
				+ "       \"quote\":\"You become what you believe.\",\"author\":\"Oprah Winfrey\"},\n"
				+ "{\n"
				+ "       \"quote\":\"I would rather die of passion than of boredom.\",\"author\":\"Vincent van Gogh\"},\n"
				+ "{\n"
				+ "       \"quote\":\"A truly rich man is one whose children run into his arms when his hands are empty.\",\"author\":\"Unknown\"},\n"
				+ "{\n"
				+ "       \"quote\":\"It is not what you do for your children, but what you have taught them to do for themselves, that will make them successful human beings.\",\"author\":\"Ann Landers\"},\n"
				+ "{\n"
				+ "       \"quote\":\"If you want your children to turn out well, spend twice as much time with them, and half as much money.\",\"author\":\"Abigail Van Buren\"},\n"
				+ "{\n"
				+ "       \"quote\":\"Build your own dreams, or someone else will hire you to build theirs.\",\"author\":\"Farrah Gray\"},\n"
				+ "{\n"
				+ "       \"quote\":\"The battles that count aren\'t the ones for gold medals. The struggles within yourself–the invisible battles inside all of us–that\'s where it\'s at.\",\"author\":\"Jesse Owens\"},\n"
				+ "{\n"
				+ "       \"quote\":\"Education costs money.  But then so does ignorance.\",\"author\":\"Sir Claus Moser\"},\n"
				+ "{\n"
				+ "       \"quote\":\"I have learned over the years that when one\'s mind is made up, this diminishes fear.\",\"author\":\"Rosa Parks\"},\n"
				+ "{\n"
				+ "       \"quote\":\"It does not matter how slowly you go as long as you do not stop.\",\"author\":\"Confucius\"},\n"
				+ "{\n"
				+ "       \"quote\":\"If you look at what you have in life, you\'ll always have more. If you look at what you don\'t have in life, you\'ll never have enough.\",\"author\":\"Oprah Winfrey\"},\n"
				+ "{\n"
				+ "       \"quote\":\"Remember that not getting what you want is sometimes a wonderful stroke of luck.\",\"author\":\"Dalai Lama\"},\n"
				+ "{\n"
				+ "       \"quote\":\"You can\'t use up creativity.  The more you use, the more you have.\",\"author\":\"Maya Angelou\"},\n"
				+ "{\n"
				+ "       \"quote\":\"Dream big and dare to fail.\",\"author\":\"Norman Vaughan\"},\n"
				+ "{\n"
				+ "       \"quote\":\"Our lives begin to end the day we become silent about things that matter.\",\"author\":\"Martin Luther King Jr.\"},\n"
				+ "{\n"
				+ "       \"quote\":\"Do what you can, where you are, with what you have.\",\"author\":\"Teddy Roosevelt\"},\n"
				+ "{\n"
				+ "       \"quote\":\"If you do what you\'ve always done, you\'ll get what you\'ve always gotten.\",\"author\":\"Tony Robbins\"},\n"
				+ "{\n"
				+ "       \"quote\":\"Dreaming, after all, is a form of planning.\",\"author\":\"Gloria Steinem\"},\n"
				+ "{\n"
				+ "       \"quote\":\"It\'s your place in the world; it\'s your life. Go on and do all you can with it, and make it the life you want to live.\",\"author\":\"Mae Jemison\"},\n"
				+ "{\n"
				+ "       \"quote\":\"You may be disappointed if you fail, but you are doomed if you don\'t try.\",\"author\":\"Beverly Sills\"},\n"
				+ "{\n"
				+ "       \"quote\":\"Remember no one can make you feel inferior without your consent.\",\"author\":\"Eleanor Roosevelt\"},\n"
				+ "{\n"
				+ "       \"quote\":\"Life is what we make it, always has been, always will be.\",\"author\":\"Grandma Moses\"},\n"
				+ "{\n"
				+ "       \"quote\":\"The question isn\'t who is going to let me; it\'s who is going to stop me.\",\"author\":\"Ayn Rand\"},\n"
				+ "{\n"
				+ "       \"quote\":\"When everything seems to be going against you, remember that the airplane takes off against the wind, not with it.\",\"author\":\"Henry Ford\"},\n"
				+ "{\n"
				+ "       \"quote\":\"It\'s not the years in your life that count. It\'s the life in your years.\",\"author\":\"Abraham Lincoln\"},\n"
				+ "{\n"
				+ "       \"quote\":\"Change your thoughts and you change your world.\",\"author\":\"Norman Vincent Peale\"},\n"
				+ "{\n"
				+ "       \"quote\":\"Either write something worth reading or do something worth writing.\",\"author\":\"Benjamin Franklin\"},\n"
				+ "{\n"
				+ "       \"quote\":\"Nothing is impossible, the word itself says, “I\'m possible!”\",\"author\":\"–Audrey Hepburn\"},\n"
				+ "{\n"
				+ "       \"quote\":\"The only way to do great work is to love what you do.\",\"author\":\"Steve Jobs\"},\n"
				+ "{\n"
				+ "       \"quote\":\"If you can dream it, you can achieve it.\",\"author\":\"Zig Ziglar\"}\n"
				+ "]\n"
				+ "}");
}