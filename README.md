# 2PL_Simulation
Two-Phase Locking Simulation for Rigorous Concurrency Protocol

Problem Statement 

In this project, the problem that must be solved is to design a program that simulates the behavior of the Two-Phase Locking (2PL) protocol with the Wait-Die method for dealing with deadlock. The input file will consist of multiple lines, with each line representing a single transaction operation. The possible operations are as follows: 
"b" (begin transaction): Indicates the beginning of a new transaction. It is followed by a transaction id, which is an integer between 1 and 9. 
"r" (read item): Represents a read operation on a data item. It is followed by the transaction id and the item name enclosed in parentheses. Item names are single letters from A to Z. 
"w" (write item): Represents a write operation on a data item. It is followed by the transaction id and the item name enclosed in parentheses. Item names are single letters from A to Z. 
"e" (end transaction): Indicates the end of a transaction. It is followed by the transaction id. 
The program reads the input file, process each transaction operation in the given sequence, and simulate the execution of these operations according to the rigorous 2PL protocol with the Wait-Die method. 
To implement the simulation, the following concepts must be analyzed: 
Transactions should follow the 2PL protocol, which means acquiring locks (read or write) on data items before accessing them and releasing the locks when done. 
If a transaction attempts to read a data item that is currently locked in write mode by another transaction, it should wait until the write lock is released. The transaction should follow the Wait-Die method to handle deadlock situations. 
If a transaction attempts to write to a data item that is already locked (either in read or write mode) by another transaction, it should wait until the lock is released. Again, the Wait-Die method should be used to deal with deadlocks. 
When a transaction is blocked and waiting for a lock, it should be added to the wait list for that specific data item. 
If a transaction is blocked and waiting for a lock, it should not execute any further operations until the lock is acquired. 
When a transaction completes its operations and reaches the end, it should release all the locks it holds. 
The goal is to implement the simulation program according to the described behavior, ensuring the accuracy of the 2PL protocol with the Wait-Die method. 

Data Structures

Map arrays will be used to store information about active transitions. Using the transaction id as an integer along with other values. Map arrays are also going to be used to add objects to the lock table. The information from the prompt will be included as values of the object. Lists of committed and aborted transactions must be initialized after a transaction of Tn is made. These data structures will be used to measure each step of the transaction while holding information about locked objects, waiting transactions, and committed/aborted transactions in each current state of the concurrency protocol. The programming language used is JS which will be implemented in Microsoft Visual Studio.

Pseudocode 

Begin Transaction: 
lock(x)=”unlocked”; 
state=”active”; 
TS[T]=age; //timestamp 

Read: 
if lock(x)= “unlocked”: 
  lock(x) ← “read-locked”; 
  read(x)←1 
else if lock(x)= “write-locked”: 
  if TS[T] < TS[Transaction_with_lock_holder]:  
  //Place in stack 
    then wait (until lock(x)= ‘unlocked’ and lock manager wake up 	transaction); 
  else: 
    abort T //wait-die method 
else: 
  read(x)←read(x)+1 

Write: 
if lock(x)= “write-locked” lock(x)= “read-locked”: 
  if TS[T] < TS[Transaction_with_lock_holder]:  
    Place in stack then wait (until lock(x)= ‘unlocked’ and lock manager wake up transaction); 
  else: 
    abort T //wait-die method 
else: 
  lock(x) ← “write-locked”; 
 
Commit: 
//release all locks held by transaction and save change made by transaction in 	database 
lock(x)=”unlocked”; 
state=”committed”; 

Abort: 
//release all locks held by the transaction 
lock(x)=”unlocked”; 
state=”aborted”; 

Results

After designing and implementing the simulation for the rigorous 2PL, we were able to successfully obtain the correct out for the first and second given inputs, as well as the test input set given in the project description. The output files can be found based on the corresponding input text file. The results show that T1 is always committed for these tests, and the commit/abort state of T2 and T3 are dependent on the condition state of the protocol steps. Depending on the read/write lock status and the time in which the transaction is initialized, it may be aborted if the previous transaction waiting list enables the wait-die method, which then results in the later transactions being aborted. 

Contribution

Christian Blundell was tasked with the technical details of the implementation, including setup for the problem as well as looking for possible ways to create the simulation. General architecture of the program, including the required functions for starting operations, ending operations, and read/write operations. These follow pseudocode previously generated in the intermediate report. Priscilia Eyum focused on the file I/O, debugging the read/write operations to verify accuracy of the 2PL rigorous protocol, and working on the general approach of the project implementation. Both members met and discussed the progress of the project and debugged various functions with the first two given inputs. Both team members were heavily involved in all sections of the project. 
