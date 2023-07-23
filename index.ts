interface Employee {
  uniqueId: number;
  name: string;
  subordinates: Employee[];
}

interface IEmployeeOrgApp {
  ceo: Employee;
  move(employeeID: number, supervisorID: number): void;
  undo(): void;
  redo(): void;
}

class EmployeeOrgApp implements IEmployeeOrgApp {
  private history: { employeeID: number; supervisorID: number }[] = [];
  private redoStack: { employeeID: number; supervisorID: number }[] = [];
  private currentIndex: number = -1;
  private immediateParent: Employee | null = {uniqueId: -1, name: '', subordinates: []};
  private previousSubordinates: Employee[] | null = [];
    private flag: boolean = false;
  private previousSubordinatesUniqueIds: number[] = [];
  private toBeUndoEmployee: Employee = {uniqueId: -1, name: '', subordinates: []};

  constructor(public ceo: Employee) {}

  private findEmployeeByID(employeeID: number, node: Employee): {employee: Employee | null; supervisor: Employee | null; previousSubordinates : Employee[] | null}{
    if (node.uniqueId === employeeID) {
      return { employee: node, supervisor: null, previousSubordinates : node.subordinates  };

    }
    for (const subordinate of node.subordinates) {
      if (subordinate.uniqueId === employeeID) {
        return { employee: subordinate, supervisor: node, previousSubordinates : subordinate.subordinates };
      } else {
        const { employee, supervisor, previousSubordinates } = this.findEmployeeByID(employeeID, subordinate);
        if (employee && supervisor) {
        supervisor.subordinates = supervisor.subordinates.filter(
        (subordinate) => subordinate.uniqueId !== employee.uniqueId
        );
        supervisor.subordinates.push(...employee.subordinates)
        employee.subordinates = []
          return { employee, supervisor, previousSubordinates };
        }
    }
  }
    return { employee: null, supervisor: null, previousSubordinates: null };
  }

  private findEmployeeByID1(employeeID: number, node: Employee): Employee | null {
    if (node.uniqueId === employeeID) {
      return node;
    }

    for (const subordinate of node.subordinates) {
      const foundEmployee = this.findEmployeeByID1(employeeID, subordinate);
      if (foundEmployee) {
        return foundEmployee;
      }
    }

    return null;
  }

  private findEmployeeByID2(employeeID: number, addedEmployeeId: number,  node: Employee): Employee | null {
    if (node.uniqueId === employeeID) {
      return node;
    }

    for (const subordinate of node.subordinates) {
      let foundEmployee = this.findEmployeeByID2(employeeID, addedEmployeeId, subordinate);
      if (foundEmployee) {
        if(foundEmployee.subordinates.length > 0){
        foundEmployee.subordinates = foundEmployee.subordinates.filter(subordinate2 => {
          if(subordinate2.uniqueId === addedEmployeeId){
            this.toBeUndoEmployee = subordinate2
          }
          return subordinate2.uniqueId !== addedEmployeeId
        })
        }
        return foundEmployee;
      }
    }

    return null;
  }

  private findEmployeeByID3(employeeID: number,  node: Employee): Employee | null {
    if (node.uniqueId === employeeID) {
      return node;
    }
    this.flag = false
    for (const subordinate of node.subordinates) {
      let foundEmployee = this.findEmployeeByID3(employeeID, subordinate);
      if (foundEmployee && !this.flag) {
        this.flag = true;
        const arr = this.previousSubordinates && this.previousSubordinates.map(item => item.uniqueId)
        if(foundEmployee.subordinates.length > 0){
        foundEmployee.subordinates = foundEmployee.subordinates.filter(subordinate3 => arr && !arr.includes(subordinate3.uniqueId))
        }
        if(this.previousSubordinates)
        this.toBeUndoEmployee.subordinates.push(...this.previousSubordinates)
        foundEmployee.subordinates.push(this.toBeUndoEmployee)
        return foundEmployee;
      }
    }

    return null;
  }

  private removeFromSupervisor(employee: Employee, supervisor: Employee) {
    supervisor.subordinates = supervisor.subordinates.filter(
      (subordinate) => subordinate.uniqueId !== employee.uniqueId
    );
  }

  move(employeeID: number, supervisorID: number): void {
    const supervisor = this.findEmployeeByID1(supervisorID, this.ceo);
    if(supervisor){
      const {employee, supervisor: oldSupervisor, previousSubordinates} = this.findEmployeeByID(employeeID, this.ceo);
    if(previousSubordinates){
      if(previousSubordinates.length > 0){
          for (const subordinate1 of previousSubordinates) {
            if(subordinate1){
              this.previousSubordinatesUniqueIds.push(subordinate1.uniqueId)
            }
          }
        }
    }
    this.previousSubordinates = previousSubordinates;
    this.immediateParent = oldSupervisor;
    if (employee && supervisor) {
      supervisor.subordinates.push(employee); // Add to new supervisor

      this.history = this.history.slice(0, this.currentIndex + 1); // Remove future actions from history
      this.history.push({ employeeID, supervisorID }); // Add move action to history
      this.redoStack = []
      this.currentIndex++; // Increment current index to the latest action
    }
    }

  }

  undo(): void {
    if (this.currentIndex >= 0) {
      const { employeeID, supervisorID } = this.history[this.currentIndex];
      const supervisor = this.findEmployeeByID2(supervisorID, employeeID, this.ceo);
      let employee;
      if(this.immediateParent)
        employee = this.findEmployeeByID3(this.immediateParent.uniqueId, this.ceo);
        this.history = []
        this.redoStack.push({employeeID, supervisorID})
        this.currentIndex--; // Decrement current index to undo the action
      // }
    }
  }


  redo(): void {
    if (this.currentIndex < this.redoStack.length) {
      this.currentIndex++; // Increment current index to redo the action
      const { employeeID, supervisorID } = this.redoStack[this.currentIndex];
      this.move(employeeID, supervisorID);
    }
  }
}

// Example usage
const ceo: Employee = {
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

const app = new EmployeeOrgApp(ceo);

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
