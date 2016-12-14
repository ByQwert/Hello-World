// Additional
function getRandomInt(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Init
var settings = {
	minWeight: 25,
	maxWeight: 100,
	speed: 1000,
};
var mainFrame = new MainFrame(),
		statistic = new Statistic();
var names = ["Bob","Tom", "Mike", "Sam", "Jack", "Steve", "Anton"];
var buttonsOfHouse = [],
		buttonsOfElevator = [];

// GUI
$( "#generate-form" ).dialog({
	resizable: false,
	height: "auto",
	width: 400,
	modal: true,
	buttons: {
		"Generate": function() {
			if ($('input[name="floors"]').val() > 0 && $('input[name="humans"]').val() > -1) {
				mainFrame.generate(+$('input[name="floors"]').val(),+$('input[name="humans"]').val());
				$( this ).dialog( "close" );				
			} else {	
				alert("Invalid data!");
			}        
		},
		"Cancel": function() {
			$( this ).dialog( "close" );
		}
	}
});

function openAddHumanForm() {
	$( "#add-human-div" ).dialog("open");
}

dialog = $( "#add-human-div" ).dialog({
  autoOpen: false,
  height: 400,
  width: 350,
  modal: true,
  buttons: {
   	"Add human": mainFrame.addHuman, 
    Cancel: function() {
      $( this ).dialog( "close" );
    }
   },
});

// Classes
function MainFrame() {
	this.generate = function(floors,humans) {
		// Create house, elevator and massives of buttons
		house = new House(floors,humans);
		elevator = new Elevator();
		for (var i = 0; i < house.amountOfFloors; i++) {
			buttonsOfHouse.push(new Button(i+1));
			buttonsOfElevator.push(new Button(i+1));
		}
		// Create humans
		for (var i = 0; i < house.amountOfHumans; i++) {
			name = names[getRandomInt(0,names.length-1)];
			weight = getRandomInt(settings.minWeight,settings.maxWeight);
			spawnFloor = getRandomInt(1,house.amountOfFloors);				
			do {
				targetFloor = getRandomInt(1,house.amountOfFloors);
			} while(spawnFloor == targetFloor);
			house.pending.push(new Human(name,weight,spawnFloor,targetFloor));
		}		
		// Update statistic
		statistic.amountOfCreatedHumans = house.amountOfHumans;
		// GUI
		$("#amount-of-floors").text(house.amountOfFloors);
		$("#amount-of-humans").text(house.amountOfHumans);		
		for (var i = 0; i < house.amountOfHumans; i++) {
			$("#pending").append('<h6>' + house.pending[i].name + '</h6><p id=' + house.pending[i].ID + '>' + house.pending[i].state + '</p>');
		}		
		$("#main-table").show();	
		$( "#pending" ).accordion({
 			collapsible: true,
 			active: false
 		});
 		$( "#passengers" ).accordion({
 			collapsible: true,
 			active: false
 		});
 		$( "#delivered" ).accordion({
 			collapsible: true,
 			active: false
 		});
	};
	this.launchSystem = function() {
		elevator.chooseNextFloor();
		$("[onclick=mainFrame\\.launchSystem\\(\\)]").prop('disabled', true);
	};
	this.stopSystem = function() {

	};
	this.addHuman = function() {
		var validator = true;
		name = $("[name=name]").val();
		weight = +$("[name=weight]").val();
		if (weight < 25 || isNaN(weight)) {
			validator = false;
		}
		spawnFloor = +$("[name=spawnFloor]").val();
		if (spawnFloor < 1 || spawnFloor > house.amountOfFloors || isNaN(spawnFloor)) {
			validator = false;
		} 
		targetFloor = +$("[name=targetFloor]").val(); 
		if (targetFloor < 1 || targetFloor > house.amountOfFloors || targetFloor == spawnFloor || isNaN(targetFloor)) {
			validator = false;
		} 
		if (validator) {
			// Create new human
			house.pending.push(new Human(name,weight,spawnFloor,targetFloor));
			house.amountOfHumans++;
			// Update statistic
			statistic.amountOfCreatedHumans++;
			// GUI
			$("#amount-of-humans").text(house.pending.length+elevator.passengers.length);			
			$("#pending").append('<h6>' + house.pending[house.pending.length-1].name + '</h6><p id='+ house.pending[house.pending.length-1].ID +'>' + house.pending[house.pending.length-1].state  + '</p>');
			$( "#pending" ).accordion( "refresh" );
			dialog.dialog("close");
			$("#add-human-form")[0].reset();
		} else {
			alert("Invalid data!");
			validator = true;
		}
		if (!buttonsOfElevator.some(function(button) {return button.state == true })) {
			elevator.chooseNextFloor();
		}
	}
}

function House(floors,humans) {
	this.amountOfFloors = floors;
	this.amountOfHumans = humans;
	this.pending = [];
	this.delivered = [];
}

function Elevator() {
	this.currentWeight;
	this.targetFloor;
	this.indicatorState;
	this.currentFloor = 1;
	this.doorState = false;
	this.state = "Staying with closed doors";
	this.passengers = [];
	this.priorityDistance = house.amountOfFloors-1;
	this.chooseNextFloor = function() {
		if (buttonsOfElevator.some(function(button) {return button.state == true })) {
			for (var i = 0; i < buttonsOfElevator.length; i++) {
				if (buttonsOfElevator[i].state) {
					if (Math.abs(this.currentFloor-i) < this.priorityDistance) {
						this.priorityDistance = Math.abs(this.currentFloor-i);
						this.targetFloor = i+1;
					}
				}
			}
			console.log(this.targetFloor);	
			this.priorityDistance = house.amountOfFloors-1;	
			this.move();
		} else {
			if (buttonsOfHouse.some(function(button) {return button.state == true })) {
				for (var i = 0; i < buttonsOfHouse.length; i++) {
					if (buttonsOfHouse[i].state) {
						if (this.currentFloor-1 == i) {
							this.targetFloor = i+1;
							break;
						} else {
							if (Math.abs(this.currentFloor-i) < this.priorityDistance) {
								this.priorityDistance = Math.abs(this.currentFloor - i);
								this.targetFloor = i+1;
							}
						}					
					}
				}
				console.log(this.targetFloor);	
				this.priorityDistance = house.amountOfFloors-1;	
				this.move();
			}
		}	
	};
	this.move = async function() {
		if (this.currentFloor == this.targetFloor) {
			this.doorState = true;
			this.state = "Staying with opened doors";	
			$("#animation").html(this.state + "<br>" + this.currentFloor);
			this.wait();
		}
		// Moving up
		if (this.currentFloor < this.targetFloor) {
			this.state = "Moving up";		
			$("#animation").html(this.state + "<br>" + this.currentFloor);
			if (this.passengers.length > 0) {
				this.passengers.forEach(function(human) {
					human.state = "Moving up at the level of the floor " +  elevator.currentFloor;
					// GUI
					$("#passengers").children('#' + human.ID).text(human.state);
				});
			}
			await sleep(settings.speed);
			for (var i = this.currentFloor+1; i != this.targetFloor+1; i++) {	
				this.currentFloor = i;
				if (i != this.targetFloor) {
					$("#animation").html(this.state + "<br>" + this.currentFloor);
					if (this.passengers.length > 0) {
						this.passengers.forEach(function(human) {
							human.state = "Moving up at the level of the floor " +  elevator.currentFloor;
							// GUI
							$("#passengers").children('#' + human.ID).text(human.state);
						});
					}
					//console.log(this.currentFloor);
					//console.log("moving");
					await sleep(settings.speed);
				} else {
					this.doorState = true;
					this.state = "Staying with opened doors";	
					// Animation
					$("#animation").html(this.state + "<br>" + this.currentFloor);
					// GUI
					this.passengers.forEach(function(human) {
						human.state = "Moving up at the level of the floor " +  elevator.currentFloor;
						// GUI
						$("#passengers").children('#' + human.ID).text(human.state);
					});				
					this.wait();
				}
			}
		} 
		// Moving down
		if (this.currentFloor > this.targetFloor) {
			this.state = "Moving down";
			$("#animation").html(this.state + "<br>" + this.currentFloor);
			if (this.passengers.length > 0) {
				this.passengers.forEach(function(human) {
					human.state = "Moving down at the level of the floor " +  elevator.currentFloor;
					// GUI
					$("#passengers").children('#' + human.ID).text(human.state);
				});
			}
			await sleep(settings.speed);
			for (var i = this.currentFloor-1; i != this.targetFloor-1; i--) {
				this.currentFloor = i;
				if (i != this.targetFloor) {
					$("#animation").html(this.state + "<br>" + this.currentFloor);	
					if (this.passengers.length > 0) {
						this.passengers.forEach(function(human) {
							human.state = "Moving down at the level of the floor " +  elevator.currentFloor;
							// GUI
							$("#passengers").children('#' + human.ID).text(human.state);
						});	
					}		
					await sleep(settings.speed);
				}	else {
					this.doorState = true;
					this.state = "Staying with opened doors";
					// Animation
					$("#animation").html(this.state + "<br>" + this.currentFloor);
					// GUI
					this.passengers.forEach(function(human) {
						human.state = "Moving down at the level of the floor " +  elevator.currentFloor;
						// GUI
						$("#passengers").children('#' + human.ID).text(human.state);
					});				
					this.wait();
				}
			}
		}
	};
	this.wait =  async function() {		
		await sleep(1000);
		// Exit
		j = 0;
		if (this.passengers.length) {
			this.passengers.forEach(function(human,i) {			
				if (human.targetFloor == elevator.currentFloor) {
					human.state = "Delivered to the target floor " + human.targetFloor;
					house.delivered.push(human);
					delete elevator.passengers[i];
					buttonsOfElevator[human.targetFloor-1].state = false;
					// GUI
					$("#delivered").append('<h6>' + house.delivered[j].name + '</h6><p id=' + house.delivered[j].ID + '>' + house.delivered[j].state + '</p>');
					$( "#delivered" ).accordion( "refresh" );
					$("#passengers").children('[aria-controls=' + human.ID + ']').remove();
					$("#passengers").children('#' + human.ID).remove();
					$( "#passengers" ).accordion( "refresh" );
					j++;
				}
			});
			this.passengers = this.passengers.filter(function(human) {
				return human != "undefined";
			});	
			setTimeout(function() { 
				house.amountOfHumans -= house.delivered.length;
				house.delivered.splice(0);
				// GUI
				$("#delivered").empty();
				$("#amount-of-humans").text(house.amountOfHumans);
			}, 2000);
		}			
		// Entrance
		j = this.passengers.length;
		house.pending.forEach(function(human, i) {
			//console.log(human.spawnFloor, elevator.currentFloor);
			if (human.spawnFloor == elevator.currentFloor) {
				human.state = "Staying in elevator on " + elevator.currentFloor + " floor";
				elevator.passengers.push(human);
				delete house.pending[i];
				buttonsOfHouse[human.spawnFloor-1].state = false;
				human.pressTargetFloorButton();
				// GUI 
				$("#passengers").append('<h6>' + elevator.passengers[j].name + '</h6><p id=' + elevator.passengers[j].ID + '>' + elevator.passengers[j].state + '</p>');
				$( "#passengers" ).accordion( "refresh" );
				$("#pending").children('[aria-controls=' + human.ID + ']').remove();
				$("#pending").children('#' + human.ID).remove();
				$( "#pending" ).accordion( "refresh" );
				j++;
			}
		});
		house.pending = house.pending.filter(function(human) {
			return human != "undefined";
		});
		this.doorsState = false;
		this.state = "Staying with closed doors";	
		$("#animation").html(this.state + "<br>" + this.currentFloor);
		this.chooseNextFloor();
	};
}

function Human(name, weight, spawnFloor, targetFloor) {
	this.name = name;
	this.weight = weight;
	this.spawnFloor = spawnFloor;
	this.targetFloor = targetFloor;		
	this.pressSpawnFloorButton = function() {
		if (!buttonsOfHouse[this.spawnFloor-1].state) {
			buttonsOfHouse[this.spawnFloor-1].state = true;
		}		
	}
	this.pressTargetFloorButton = function() {
		if (!buttonsOfElevator[this.targetFloor-1].state) {
			buttonsOfElevator[this.targetFloor-1].state = true;
		}
	}
	this.pressMoveButton = function() {
	};
	this.wait = function() {
	}
	this.pressSpawnFloorButton();
	this.state = "Waiting for elevator on " + this.spawnFloor + " floor";	
	this.ID = this.name + '-' + this.spawnFloor + '-' + this.targetFloor;
}

function Button(floor) {
	this.state = false;
	this.floor = floor;
}

function Statistic() {
	this.amountOfRides = 0;
	this.amountOfEmptyRides = 0;
	this.sumWeight = 0;
	this.amountOfCreatedHumans = 0;
}