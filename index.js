var EmployeeOrgApp = /** @class */ (function () {
    function EmployeeOrgApp(ceo) {
        this.ceo = ceo;
        this.history = [];
        this.redoStack = [];
        this.currentIndex = -1;
        this.immediateParent = { uniqueId: -1, name: '', subordinates: [] };
        this.previousSubordinates = [];
        this.flag = false;
        this.previousSubordinatesUniqueIds = [];
        this.toBeUndoEmployee = { uniqueId: -1, name: '', subordinates: [] };
    }
    EmployeeOrgApp.prototype.findEmployeeByID = function (employeeID, node) {
        if (node.uniqueId === employeeID) {
            return { employee: node, supervisor: null, previousSubordinates: node.subordinates };
        }
        var _loop_1 = function (subordinate) {
            var _b;
            if (subordinate.uniqueId === employeeID) {
                return { value: { employee: subordinate, supervisor: node, previousSubordinates: subordinate.subordinates } };
            }
            else {
                var _c = this_1.findEmployeeByID(employeeID, subordinate), employee_1 = _c.employee, supervisor = _c.supervisor, previousSubordinates = _c.previousSubordinates;
                if (employee_1 && supervisor) {
                    supervisor.subordinates = supervisor.subordinates.filter(function (subordinate) { return subordinate.uniqueId !== employee_1.uniqueId; });
                    (_b = supervisor.subordinates).push.apply(_b, employee_1.subordinates);
                    employee_1.subordinates = [];
                    return { value: { employee: employee_1, supervisor: supervisor, previousSubordinates: previousSubordinates } };
                }
            }
        };
        var this_1 = this;
        for (var _i = 0, _a = node.subordinates; _i < _a.length; _i++) {
            var subordinate = _a[_i];
            var state_1 = _loop_1(subordinate);
            if (typeof state_1 === "object")
                return state_1.value;
        }
        return { employee: null, supervisor: null, previousSubordinates: null };
    };
    EmployeeOrgApp.prototype.findEmployeeByID1 = function (employeeID, node) {
        if (node.uniqueId === employeeID) {
            return node;
        }
        for (var _i = 0, _a = node.subordinates; _i < _a.length; _i++) {
            var subordinate = _a[_i];
            var foundEmployee = this.findEmployeeByID1(employeeID, subordinate);
            if (foundEmployee) {
                return foundEmployee;
            }
        }
        return null;
    };
    EmployeeOrgApp.prototype.findEmployeeByID2 = function (employeeID, addedEmployeeId, node) {
        var _this = this;
        if (node.uniqueId === employeeID) {
            return node;
        }
        for (var _i = 0, _a = node.subordinates; _i < _a.length; _i++) {
            var subordinate = _a[_i];
            var foundEmployee = this.findEmployeeByID2(employeeID, addedEmployeeId, subordinate);
            if (foundEmployee) {
                if (foundEmployee.subordinates.length > 0) {
                    foundEmployee.subordinates = foundEmployee.subordinates.filter(function (subordinate2) {
                        if (subordinate2.uniqueId === addedEmployeeId) {
                            _this.toBeUndoEmployee = subordinate2;
                        }
                        return subordinate2.uniqueId !== addedEmployeeId;
                    });
                }
                return foundEmployee;
            }
        }
        return null;
    };
    EmployeeOrgApp.prototype.findEmployeeByID3 = function (employeeID, node) {
        if (node.uniqueId === employeeID) {
            return node;
        }
        this.flag = false;
        var _loop_2 = function (subordinate) {
            var _b;
            var foundEmployee = this_2.findEmployeeByID3(employeeID, subordinate);
            if (foundEmployee && !this_2.flag) {
                this_2.flag = true;
                var arr_1 = this_2.previousSubordinates && this_2.previousSubordinates.map(function (item) { return item.uniqueId; });
                if (foundEmployee.subordinates.length > 0) {
                    foundEmployee.subordinates = foundEmployee.subordinates.filter(function (subordinate3) { return arr_1 && !arr_1.includes(subordinate3.uniqueId); });
                }
                if (this_2.previousSubordinates)
                    (_b = this_2.toBeUndoEmployee.subordinates).push.apply(_b, this_2.previousSubordinates);
                foundEmployee.subordinates.push(this_2.toBeUndoEmployee);
                return { value: foundEmployee };
            }
        };
        var this_2 = this;
        for (var _i = 0, _a = node.subordinates; _i < _a.length; _i++) {
            var subordinate = _a[_i];
            var state_2 = _loop_2(subordinate);
            if (typeof state_2 === "object")
                return state_2.value;
        }
        return null;
    };
    EmployeeOrgApp.prototype.removeFromSupervisor = function (employee, supervisor) {
        supervisor.subordinates = supervisor.subordinates.filter(function (subordinate) { return subordinate.uniqueId !== employee.uniqueId; });
    };
    EmployeeOrgApp.prototype.move = function (employeeID, supervisorID) {
        var supervisor = this.findEmployeeByID1(supervisorID, this.ceo);
        if (supervisor) {
            var _a = this.findEmployeeByID(employeeID, this.ceo), employee = _a.employee, oldSupervisor = _a.supervisor, previousSubordinates = _a.previousSubordinates;
            if (previousSubordinates) {
                if (previousSubordinates.length > 0) {
                    for (var _i = 0, previousSubordinates_1 = previousSubordinates; _i < previousSubordinates_1.length; _i++) {
                        var subordinate1 = previousSubordinates_1[_i];
                        if (subordinate1) {
                            this.previousSubordinatesUniqueIds.push(subordinate1.uniqueId);
                        }
                    }
                }
            }
            this.previousSubordinates = previousSubordinates;
            this.immediateParent = oldSupervisor;
            if (employee && supervisor) {
                supervisor.subordinates.push(employee); // Add to new supervisor
                this.history = this.history.slice(0, this.currentIndex + 1); // Remove future actions from history
                this.history.push({ employeeID: employeeID, supervisorID: supervisorID }); // Add move action to history
                this.redoStack = [];
                this.currentIndex++; // Increment current index to the latest action
            }
        }
    };
    EmployeeOrgApp.prototype.undo = function () {
        if (this.currentIndex >= 0) {
            var _a = this.history[this.currentIndex], employeeID = _a.employeeID, supervisorID = _a.supervisorID;
            var supervisor = this.findEmployeeByID2(supervisorID, employeeID, this.ceo);
            var employee = void 0;
            if (this.immediateParent)
                employee = this.findEmployeeByID3(this.immediateParent.uniqueId, this.ceo);
            this.history = [];
            this.redoStack.push({ employeeID: employeeID, supervisorID: supervisorID });
            this.currentIndex--; // Decrement current index to undo the action
            // }
        }
    };
    EmployeeOrgApp.prototype.redo = function () {
        if (this.currentIndex < this.redoStack.length) {
            this.currentIndex++; // Increment current index to redo the action
            var _a = this.redoStack[this.currentIndex], employeeID = _a.employeeID, supervisorID = _a.supervisorID;
            this.move(employeeID, supervisorID);
        }
    };
    return EmployeeOrgApp;
}());
// Example usage
var ceo = {
    uniqueId: 1,
    name: 'John Smith',
    subordinates: [
        {
            uniqueId: 2,
            name: 'Margot Donald',
            subordinates: [
                {
                    uniqueId: 3,
                    name: 'Cassandra Reynolds',
                    subordinates: [
                        {
                            uniqueId: 4,
                            name: 'Mary Blue',
                            subordinates: [],
                        },
                        {
                            uniqueId: 5,
                            name: 'Bob Saget',
                            subordinates: [
                                {
                                    uniqueId: 6,
                                    name: 'Tina Teff',
                                    subordinates: [
                                        {
                                            uniqueId: 7,
                                            name: 'Will Turner',
                                            subordinates: [],
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
            ],
        },
        {
            uniqueId: 8,
            name: 'Tyler Simpson',
            subordinates: [
                {
                    uniqueId: 9,
                    name: 'Harry Tobs',
                    subordinates: [
                        {
                            uniqueId: 10,
                            name: 'Thomas Brown',
                            subordinates: [],
                        },
                    ],
                },
                {
                    uniqueId: 11,
                    name: 'George Carrey',
                    subordinates: [],
                },
                {
                    uniqueId: 12,
                    name: 'Gary Styles',
                    subordinates: [],
                },
            ],
        },
        {
            uniqueId: 13,
            name: 'Ben Willis',
            subordinates: [],
        },
        {
            uniqueId: 14,
            name: 'Georgina Flangy',
            subordinates: [
                {
                    uniqueId: 15,
                    name: 'Sophie Turner',
                    subordinates: [],
                },
            ],
        },
    ],
};
var app = new EmployeeOrgApp(ceo);
console.log('Initial Organization Chart:');
console.log(JSON.stringify(app.ceo, null, 2));
// Move Bob Saget to become a subordinate of Georgina Flangy
app.move(5, 14);
console.log('\nOrganization Chart after move:');
console.log(JSON.stringify(app.ceo, null, 2));
// Undo the move action
app.undo();
console.log('\nOrganization Chart after undo:');
console.log(JSON.stringify(app.ceo, null, 2));
// Redo the move action
app.redo();
console.log('\nOrganization Chart after redo:');
console.log(JSON.stringify(app.ceo, null, 2));
