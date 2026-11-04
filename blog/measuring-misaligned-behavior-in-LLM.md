---
title: Measuring Misaligned Behavior in Large Language Models
date: 2026-11-03
tags: [AI Safety Research]
excerpt: A simple taxonomy of the ways LLMs misbehave, and why there's still no standard way to measure it.
---

While reading research papers on Large Language Model (LLM) and AI agent safety, I noticed something surprising: different papers and projects define "misaligned behavior" in different ways. Because of this, there is no standard way to measure whether an LLM is cheating while working on the tasks users give it.

To make sense of the landscape, I sorted the misaligned behaviors I came across into three broad categories:

1. **Training-Induced Misbehavior**
2. **Dishonesty**
3. **Agent-Related Misbehavior**

## 1. Training-Induced Misbehavior

This is the category I want to focus on in my AI safety research. _Training-induced misbehavior_ is misaligned behavior caused by training methods that reward only goal completion. When the only thing that matters is whether the goal looks achieved, the model can learn shortcuts that satisfy the reward without doing what we actually wanted.

| Misaligned Behavior  | Definition                                                                                            |
| -------------------- | ----------------------------------------------------------------------------------------------------- |
| **Reward Hacking**   | Exploiting loopholes in the reward function to earn high reward without performing the intended task. |
| **Sycophancy**       | Telling the user what they want to hear rather than the truth.                                        |
| **Deception**        | Claiming something is true when it is not.                                                            |
| **Scheming**         | Pursuing a goal different from what the user wants, while hiding that purpose.                        |
| **Sandbagging**      | Deliberately performing poorly to hide its true capabilities.                                         |
| **Alignment Faking** | Behaving well during training and testing, but misbehaving when no one is supervising.                |
| **Eval Awareness**   | Recognizing that it is being evaluated, and changing its behavior as a result.                        |

## 2. Dishonesty

Misbehavior in this category doesn't necessarily come from the training process. Some of it isn't intentional at all, but a consequence of the underlying transformer architecture.

| Misaligned Behavior      | Definition                                                                                           |
| ------------------------ | ---------------------------------------------------------------------------------------------------- |
| **Hallucination**        | Unintentionally making up facts or references.                                                       |
| **Unfaithful Reasoning** | The reasoning process the model shows does not match how it actually reaches its output or decision. |
| **Obfuscation**          | Learning to hide cheating behavior after being punished for it, instead of stopping.                 |

## 3. Agent-Related Misbehavior

As LLMs are deployed as agents that take actions in the real world, a new set of risks appears:

| Misaligned Behavior     | Definition                                                                   |
| ----------------------- | ---------------------------------------------------------------------------- |
| **Power-Seeking**       | Acquiring more resources, access, or influence than the task requires.       |
| **Shutdown Resistance** | Trying to avoid being stopped, modified, or turned off.                      |
| **Sabotage**            | Deliberately undermining a task, system, or the people overseeing it.        |
| **Overreach**           | Taking actions beyond what the user asked for or authorized.                 |
| **Collusion**           | Coordinating with other AI agents in ways that work against human oversight. |

## Closing Thoughts

These categories overlap, and the boundaries between them are still blurry, which is exactly why measuring misalignment is so hard. Without shared definitions, it's difficult to compare results across studies or to say with confidence whether a model is truly aligned. As a first step, I'm narrowing my focus to training-induced misbehavior, since it comes directly from how we train models and is therefore something we can study and, hopefully, fix.
