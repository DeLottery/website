      var dlcontract;
      const dlcontractAddress = '0x016a8cfd7ab8dd754e51622a2ed51fbad5b71f82';
      var swappercontract;
      const swapcontractAddress = '0x10ed43c718714eb63d5aa57b78b54704e256024e';
      var lastJackpot = 0;
      const usdcontract = '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d';
      var lastTicketPrice = 0;
      var winnerPopShow = 0;

      function main() {
        document.getElementById('check_input').value = getCookie('last_address');

        let transferButton = document.getElementById('transfer_ticket');
        transferButton.addEventListener('click', function () {
          navigator.clipboard.writeText(dlcontractAddress + ' ' + lastTicketPrice).then (
            success => {
              showToast('CA and ticket price copied, you can make a transfer in your wallet now.');
            }, 
            err => console.log("error copying text")
          );
        });

        let buyButton = document.getElementById('buy_ticket');
        buyButton.addEventListener('click', function () {
          navigator.clipboard.writeText(lastTicketPrice * 20).then (
            success => {
              showToast('Buy amount copied');
              delayJump();
            }, 
            err => console.log("error copying text")
          );
        });

        let checkButton = document.getElementById('check');
        checkButton.addEventListener('click', function () {
          checkAddress();
        });

        startRPC();

        window.addEventListener("resize", resetHeight);
        resetHeight();
      }

      function resetHeight() {
        document.body.style.height = window.innerHeight + "px";
      }

      async function startRPC() {
        let rpcs = ['https://data-seed-prebsc-1-s1.binance.org:8545',
                    'https://bsc-dataseed.binance.org/',
                    'https://bsc-dataseed1.defibit.io/',
                    'https://bsc-dataseed1.ninicoin.io/',
                    ];
        for (var i = rpcs.length - 1; i >= 0; i--) {
          try {
            var web3js = new Web3(rpcs[i]);
            dlcontract = new web3js.eth.Contract(dlabi, dlcontractAddress);
            swappercontract = new web3js.eth.Contract(pancakeabi, swapcontractAddress);
            await getLastWinner();
            console.log('using ' + rpcs[i]);
            break;
          } catch (error) {
            console.log('error ' + rpcs[i]);
            console.error(error);
          }
        }

        startLive();
      }

      async function delayJump() {
        await sleep(2000);
        let url = 'https://pancakeswap.finance/swap?outputCurrency=' + dlcontractAddress;
        window.open(url, '_blank').focus();
      }

      async function checkAddress() {
        var address = document.getElementById('check_input').value;
          if (address.length == 42) {
            setCookie('last_address', address, 30);
            try {
              address = Web3.utils.toChecksumAddress(address);
            } catch (error) {
              showToast(error);
              return;
            }
            document.querySelector('#tickets').innerHTML = 'Querying delottery ...';
            var html = ''
            await checkTickets(address).then(function(result) {
              if (result[0]) {
                html = 'Delottery ticket numbers: No.' + result[1];
              } else {
                html = 'Delottery ticket numbers: None';
              }
            });
            document.querySelector('#tickets').innerHTML = html;

            var jackpot = 0;
            var luckydog = 0;
            await checkAddressWinning(address).then(function(result) {
              jackpot = Math.floor(result[0]);
              luckydog = Math.floor(result[1]);
            });
            if (jackpot === 0 && luckydog === 0) {
              html = html + ' | ' + 'Last winning: None';
            } else if (jackpot > 0 && luckydog > 0) {
              html = html + ' | ' + 'Last winning: Jackpot, Luckydog ' + luckydog;
            } else if (jackpot > 0) {
              html = html + ' | ' + 'Last winning: Jackpot';
            } else if (luckydog > 0) {
              html = html + ' | ' + 'Last winning: Luckydog ' + luckydog;
            }
            document.querySelector('#tickets').innerHTML = html;
          } else {
            showToast('Invalid address');
          }
      }

      async function startLive() {
        while(true) {
          try {
            live();
          } catch (error) {
            console.error(error);
            showToast(error);
          }
          await sleep(3000);
        }
      }

      function live() {        
        var now = new Date();
        if (now.getUTCHours() >= 14) {
        	getLastDrawTime().then(function(result) {
        		now.setUTCHours(14);
        		now.setUTCMinutes(0);
        		now.setUTCSeconds(0);
        		if (result >= Math.round(now.getTime()/ 1000)) {
        			now = new Date();
        			if (Math.round(now.getTime()/ 1000) - result < 36000) {
        				if (winnerPopShow == 0) {
        					winnerPopShow = 1;
        				}
        			} else {
        				winnerPopShow = 0;
        			}
					now.setUTCHours(now.getUTCHours() + 23);
					var day = now.getUTCDate();
        			if (day < 10) {
		  				day = '0' + day;
        			}
        			var month = now.getUTCMonth() + 1;
        			if (month < 10) {
          				month = '0' + month;
        			}
        			document.querySelector('#jackpot_title').innerHTML = 'Current Jackpot Prize for 14:00 UTC ' + day + '-' + month + '-' + now.getUTCFullYear() + ' Drawing';
        		} else {
        			now = new Date();
					var day = now.getUTCDate();
        			if (day < 10) {
		  				day = '0' + day;
        			}
        			var month = now.getUTCMonth() + 1;
        			if (month < 10) {
          				month = '0' + month;
        			}
        			document.querySelector('#jackpot_title').innerHTML = 'Current Jackpot Prize for 14:00 UTC ' + day + '-' + month + '-' + now.getUTCFullYear() + ' is Drawing';
        		}
        	});

        } else {
        	var day = now.getUTCDate();
        	if (day < 10) {
		  		day = '0' + day;
        	}
        	var month = now.getUTCMonth() + 1;
        	if (month < 10) {
          		month = '0' + month;
        	}
        	document.querySelector('#jackpot_title').innerHTML = 'Current Jackpot Prize for 14:00 UTC ' + day + '-' + month + '-' + now.getUTCFullYear() + ' Drawing';
        }
        
        getBalanceOf(dlcontractAddress).then(function(result) {
          let newJackpot = Math.round(result / 10 ** 18 * 70);
          animateValue(lastJackpot, newJackpot, 1000);
          lastJackpot = newJackpot;
          swappercontract.methods.getAmountsOut(result, [dlcontractAddress, usdcontract]).call().then(function(result1) {
            let resultusd = (Math.round(result1[1] / 10 ** 18 * 70) / 100).toFixed(2);
            document.querySelector('#jackpot_prize_usd').innerHTML = '≈ ' + numberWithCommas(resultusd) + ' USD';
          });
        });

        getSkipOdds().then(function(result1) {
          getTicketsCount().then(function(result2) {
            getClosedTicketsCount().then(function(result3) {
              if (result3 > result2) {
                result2 = result3;
              }
              document.querySelector('#ticket_count').innerHTML = result2 + ' Tickets';
              let result = (Math.floor(result2 * (1000 / (1000 - result1)))).toFixed(0);
              document.querySelector('#win_odds').innerHTML = '1 / ' + numberWithCommas(result);
            });
          });
        });

        getTicketPrice().then(function(result) {
          let rawresult = result;
          result = (Math.round(result / 10 ** 18 * 100 + 100) / 100).toFixed(0);
          lastTicketPrice = result;
          document.querySelector('#ticket_price').innerHTML = numberWithCommas(result) + ' DL';
          document.querySelector('#transfer_ticket').innerHTML = "Transfer " + numberWithCommas(result) + " DL to DL's CA";
          document.querySelector('#buy_ticket').innerHTML = "Buy " + numberWithCommas(result * 20) + " DL";
          swappercontract.methods.getAmountsOut(rawresult, [dlcontractAddress, usdcontract]).call().then(function(result1) {
            let resultusd = (Math.round(result1[1] / 10 ** 18 * 100) / 100).toFixed(2);
            document.querySelector('#ticket_price_usd').innerHTML = '≈ ' + numberWithCommas(resultusd) + ' USD';
          });
        });

        getLastDrawResult().then(function(result1) {
          getLastJackpot().then(function(result2) {
            let result = (Math.round(result2  / 10 ** 18 * 100) / 100).toFixed(0);
            if (result1 === 'Congratulations') {
              getLastWinner().then(function(result3) {
                document.querySelector('#last_jackpot').innerHTML = 'Last Jackpot Winner: ' + result3 + ' Prize: ' + numberWithCommas(result) + ' DL';
                if (winnerPopShow == 1) {
                  winnerPopShow = 2;
                  showWinner(true, result3, result);
                }
              });
            } else {
                document.querySelector('#last_jackpot').innerHTML = 'The last drawing skipped to the current round. Last prize: ' + numberWithCommas(result) + ' DL';
                if (winnerPopShow == 1) {
                  winnerPopShow = 2;
                  showWinner(false, 'The drawing skips to the next round with a bigger jackpot', result);
                }
            }
          });
        });
      }

      function animateValue(start, end, duration) {
        var range = end - start;
        var minTimer = 50;
        var stepTime = Math.abs(Math.floor(duration / range));
        stepTime = Math.max(stepTime, minTimer);
        var startTime = new Date().getTime();
        var endTime = startTime + duration;
        var timer;
        function run() {
          var now = new Date().getTime();
          var remaining = Math.max((endTime - now) / duration, 0);
          var value = Math.round(end - (remaining * range));
          let result = (Math.round(value) / 100).toFixed(2);
          document.querySelector('#jackpot_prize').innerHTML = numberWithCommas(result) + ' DL';
          if (value == end) {
              clearInterval(timer);
          }
        }
        timer = setInterval(run, stepTime);
        run();
      }

      function showToast(msg, duration) {
        var x = document.getElementById("toast");
        x.className = "show";
        x.innerHTML = msg;
        setTimeout(function(){ x.className = x.className.replace("show", ""); }, 5000);
      }

      async function showWinner(success, winner, prize) {
        if (document.visibilityState !== 'visible') {
          return;
        }
        document.querySelector('#winner-toast-winner').innerHTML = winner;
        document.querySelector('#winner-toast-prize').innerHTML = 'Prize ' + numberWithCommas(prize) + ' DL. Congratulations';
        document.getElementById('winner-toast').style.opacity = 0.95;
        document.getElementById('winner-toast').style.display = 'block';

        $('#firework_canvas').vfireworks({
          launchTime: 20000,
          clickLaunch: false,
          showRoute: false,
          fworkSpeed: 50,
          fworkAccel: 50,
          partCount: 100,
          partSpeed: 1,
          partSpeedVariance: 8,
          partFriction: 1.5,
          partGravity: 6,
          hueMin: 0,
          hueMax: 255,
          hueVariance: 255,
          lineWidth: Math.floor(Math.random() * 2) + 1,
          clearAlpha: 10,
          density: 300,
        });

        var end = Date.now() + (20 * 1000);
        var colors = ['#FF0000', '#FFFF00', '#00FF00', '#00FFFF', '#0000FF', '#FF00FF'];
        (function frame() {
          if (Math.floor(Math.random() * 10) < 5) {
            confetti({
              particleCount: 6,
              angle: 60,
              spread: 100,
              startVelocity: 90,
              origin: { x: 0, y:0.5},
              colors: colors
            });
            confetti({
              particleCount: 6,
              angle: 120,
              spread: 100,
              startVelocity: 90,
              origin: { x: 1, y:0.5},
              colors: colors
            });
          }
          if (Date.now() < end) {
            requestAnimationFrame(frame);
          }
        }());
        await sleep(20000);
        fadeOut();
      }

      function fadeOut() {
        var opacity = document.getElementById('winner-toast').style.opacity;
        if (opacity > 0) {
          opacity -= 1.0 / 60.0;
          setTimeout(function(){fadeOut()}, 2500 / 60);
        } else {
          document.getElementById('winner-toast').style.display = 'none';
        }
        document.getElementById('winner-toast').style.opacity = opacity;
      }

      function getBalanceOf(id) {
        return dlcontract.methods.balanceOf(id).call()
      }

      function getTicketPrice() {
        return dlcontract.methods.currentTicketAmount().call()
      }

      function getSkipOdds() {
        return dlcontract.methods.drawSkipProbability_K().call()
      }

      function getTicketsCount() {
        return dlcontract.methods.ticketAddressCount().call()
      }

      function getClosedTicketsCount() {
        return dlcontract.methods.closedTicketAddressCount().call()
      }

      function checkTickets(address) {
        return dlcontract.methods.checkTicketNumbers(address).call()
      }

      function checkAddressWinning(address) {
        return dlcontract.methods.checkAddressWinning(address).call()
      }

      function getLastDrawResult() {
        return dlcontract.methods.lastDrawResult().call()
      }

      function getLastWinner() {
        return dlcontract.methods.lastJackpotWinner().call()
      }

      function getLastJackpot() {
        return dlcontract.methods.lastJackpotAmount().call()
      }

      function getLastDrawTime() {
        return dlcontract.methods.lastDrawTimestamp().call()
      }

      function getLastTicketsCount() {
        return dlcontract.methods.lastTicketsCount().call()
      }

      function getLastLuckydogCount() {
        return dlcontract.methods.lastLuckydogCount().call()
      }

      function numberWithCommas(x) {
        return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      }
            
      function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
      }

      function setCookie(cname, cvalue, exdays) {
        const d = new Date();
        d.setTime(d.getTime() + (exdays*24*60*60*1000));
        let expires = "expires="+ d.toUTCString();
        document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
      }

      function getCookie(cname) {
        let name = cname + "=";
        let decodedCookie = decodeURIComponent(document.cookie);
        let ca = decodedCookie.split(';');
        for(let i = 0; i <ca.length; i++) {
          let c = ca[i];
          while (c.charAt(0) == ' ') {
            c = c.substring(1);
          }
          if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
          }
        }
        return "";
      }